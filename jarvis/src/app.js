// @ts-check
// Interfaz: une el diálogo, la voz, la IA local y las vistas.

import * as ai from './ai.js';
import { busyBetween, conflicts } from './agenda.js';
import { aiContext, applyShifts, dueReminders, inferArea, morningBriefing, respond, scheduledDigest } from './assistant.js';
import { buildIcs, shareFile } from './ics.js';
import { createState, loadState, MAX_MESSAGES, sanitizeEvent, sanitizeState, sanitizeTask, saveState, uid } from './store.js';
import {
  addDays, civilOf, dayEnd, dayKey, dayStart, diffDays, fmtLongDay, fmtTime, fromZoned, hhmmToMin, MONTHS,
  parseDayKey, startOfWeek, WEEKDAYS,
} from './time.js';
import { audioUnlocked, createRecognizer, onVoicesChanged, pickVoice, spanishVoices, speak, stopSpeaking, unlockAudio } from './voice.js';

/** @typedef {import('./store.js').State} State */
/** @typedef {import('./store.js').CalEvent} CalEvent */
/** @typedef {import('./store.js').Task} Task */
/** @typedef {import('./time.js').CivilDate} CivilDate */

const APP_VERSION = '1.0.0';

// ---------------------------------------------------------------- utilidades DOM

/** @param {string} id */
function byId(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Falta el elemento #${id}`);
  return el;
}

/**
 * Crea elementos sin innerHTML, así ningún texto del usuario se interpreta como HTML.
 * @param {string} tag
 * @param {Record<string, unknown>} [props]
 * @param {...(Node | string | null | undefined | false | (Node | string | null | undefined | false)[])} children
 * @returns {any}
 */
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = String(v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), /** @type {EventListener} */ (v));
    else if (k in el) /** @type {any} */ (el)[k] = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

const input = /** @type {HTMLInputElement} */ (byId('input'));
const chatEl = byId('chat');
const statusEl = byId('status');
const talkBtn = byId('talk');
const sheet = /** @type {HTMLDialogElement} */ (byId('sheet'));

let toastTimer = 0;
/** @param {string} text */
function toast(text) {
  const el = byId('toast');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { el.hidden = true; }, 4500);
}

/** @param {string} text @param {boolean} [live] */
function setStatus(text, live = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('is-live', live);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || /** @type {any} */ (navigator).standalone === true;
}

// ---------------------------------------------------------------- estado

let state = loadState(localStorage);
let view = 'talk';
let weekOffset = 0;
/** @type {string | null} */
let areaFilter = null;
let working = false;
let saveWarned = false;
/** @type {{ phase: 'off' | 'unsupported' | 'loading' | 'ready' | 'error', progress: number, text: string }} */
const aiStatus = { phase: 'off', progress: 0, text: '' };

/** @param {State} next */
function commit(next) {
  state = next;
  if (!saveState(localStorage, state) && !saveWarned) {
    saveWarned = true;
    toast('No puedo guardar en este dispositivo. ¿Estás en navegación privada?');
  }
  render();
}

/**
 * @param {State} s
 * @param {'user' | 'assistant'} role
 * @param {string} text
 * @returns {State}
 */
function withMessage(s, role, text) {
  return { ...s, messages: [...s.messages, { id: uid(), role, text, at: new Date().toISOString() }].slice(-MAX_MESSAGES) };
}

/** @param {string} text */
function say(text) {
  if (!state.settings.speak || !audioUnlocked()) return;
  speak(text, state.settings.voiceURI, {
    onStart: () => setStatus('Hablando…', true),
    onEnd: () => setStatus(''),
  });
}

// ---------------------------------------------------------------- conversación

/**
 * @param {string} raw
 * @param {'voz' | 'texto'} source
 */
async function handleInput(raw, source) {
  const text = raw.trim();
  if (!text || working) return;
  working = true;
  stopSpeaking();
  const now = new Date();
  const withUser = withMessage(state, 'user', text);
  const r = respond(withUser, text, now, { source });
  let next = r.state;
  let reply = r.reply;
  let spoken = r.speak;
  if (!r.understood && ai.isReady()) {
    commit(next);
    setStatus('Pensando…', true);
    try {
      const out = await ai.interpret(text, {
        name: state.settings.assistantName,
        context: aiContext(next, now),
        history: withUser.messages.slice(-5, -1),
      });
      if (out?.tipo === 'orden') {
        const r2 = respond(next, out.orden, new Date(), { source });
        if (r2.understood) ({ state: next, reply, speak: spoken } = r2);
        else if (out.respuesta) reply = spoken = out.respuesta;
      } else if (out?.tipo === 'charla') {
        reply = spoken = out.respuesta;
      }
    } catch {
      toast('La IA ha fallado en esta respuesta; uso el intérprete básico.');
    }
  }
  commit(withMessage(next, 'assistant', reply));
  working = false;
  setStatus('');
  say(spoken);
}

byId('composer').addEventListener('submit', (e) => {
  e.preventDefault();
  unlockAudio();
  const text = input.value;
  input.value = '';
  handleInput(text, 'texto');
});
byId('pending-yes').addEventListener('click', () => { unlockAudio(); handleInput('sí', 'texto'); });
byId('pending-no').addEventListener('click', () => { unlockAudio(); handleInput('no', 'texto'); });

const DICTATION_HINT = 'Pulsa el campo de texto y usa el micrófono del teclado para dictar.';
const recognizer = createRecognizer({
  onFinal: (t) => handleInput(t, 'voz'),
  onPartial: (t) => { input.value = t; },
  onError: (code) => {
    if (code === 'no-speech' || code === 'aborted') return;
    toast(`El dictado no está disponible aquí. ${DICTATION_HINT}`);
  },
  onEnd: () => {
    talkBtn.classList.remove('is-listening');
    byId('talk-label').textContent = 'Mantén para hablar';
    input.value = '';
    setStatus('');
  },
});

if (recognizer) {
  const stop = () => recognizer.stop();
  talkBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    unlockAudio();
    stopSpeaking();
    talkBtn.setPointerCapture(e.pointerId);
    talkBtn.classList.add('is-listening');
    byId('talk-label').textContent = 'Te escucho… suelta al acabar';
    setStatus('Escuchando…', true);
    recognizer.start();
  });
  talkBtn.addEventListener('pointerup', stop);
  talkBtn.addEventListener('pointercancel', stop);
  talkBtn.addEventListener('contextmenu', (e) => e.preventDefault());
} else {
  byId('talk-label').textContent = 'Dictar con el teclado';
  talkBtn.addEventListener('click', () => {
    unlockAudio();
    input.focus();
    toast(DICTATION_HINT);
  });
}

// ---------------------------------------------------------------- render

function render() {
  byId('app-title').textContent = state.settings.assistantName;
  document.title = state.settings.assistantName;
  renderChat();
  renderPending();
  if (view === 'week') renderWeek();
  if (view === 'tasks') renderTasks();
  if (view === 'settings') renderSettings();
}

function renderChat() {
  chatEl.replaceChildren(
    ...(state.messages.length
      ? state.messages.map((m) => h('div', { class: `msg ${m.role}` }, m.text,
        m.role === 'assistant' ? h('button', { type: 'button', class: 'replay', 'aria-label': 'Escuchar', onclick: () => { unlockAudio(); speak(m.text, state.settings.voiceURI); } }, '▶︎') : null))
      : [h('p', { class: 'empty' }, `Dime qué tienes que hacer, por ejemplo: «el jueves a las cinco tengo que ir al banco».`)]),
  );
  chatEl.scrollTop = chatEl.scrollHeight;
}

function renderPending() {
  const p = state.pending;
  const live = p !== null && Date.parse(p.expiresAt) > Date.now();
  byId('pending').hidden = !live;
  if (live && p) byId('pending-text').textContent = p.summary;
}

/** @param {CivilDate} c */
const shortDay = (c) => `${c.d} ${MONTHS[c.m - 1].slice(0, 3)}`;

function renderWeek() {
  const root = byId('view-week');
  const now = new Date();
  const today = civilOf(now);
  const monday = addDays(startOfWeek(today), weekOffset * 7);
  const sunday = addDays(monday, 6);
  const from = dayStart(monday).getTime();
  const to = dayEnd(sunday).getTime();
  const busy = busyBetween(state, from, to);
  const areaColor = (/** @type {string} */ id) => state.areas.find((a) => a.id === id)?.color ?? '#888';

  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(monday, i);
    const ds = dayStart(day).getTime();
    const de = dayEnd(day).getTime();
    const key = dayKey(day);
    const rows = [];
    if (state.shifts.some((s) => s.isDayOff && s.day === key)) rows.push(h('div', { class: 'item shift' }, h('time', {}, 'Todo el día'), 'Libras'));
    for (const b of busy.filter((x) => x.start >= ds && x.start < de)) {
      if (b.kind === 'event') {
        const ev = state.events.find((e) => e.id === b.id);
        if (!ev || (areaFilter && ev.areaId !== areaFilter)) continue;
        rows.push(h('button', { type: 'button', class: 'item', onclick: () => openEventSheet(ev, day) },
          h('span', { class: 'dot', style: `background:${areaColor(ev.areaId)}` }),
          h('time', {}, `${fmtTime(b.start)}–${fmtTime(b.end)}`),
          h('span', {}, ev.title, ev.important ? ' ★' : '')));
      } else if (b.kind === 'shift') {
        rows.push(h('button', { type: 'button', class: 'item shift', onclick: () => openShiftsSheet(monday) },
          h('time', {}, `${fmtTime(b.start)}–${fmtTime(b.end)}`), 'Turno'));
      } else {
        rows.push(h('button', { type: 'button', class: 'item block', onclick: () => toast('Es un bloque fijo semanal. Lo cambias en Ajustes › Memoria.') },
          h('time', {}, `${fmtTime(b.start)}–${fmtTime(b.end)}`), b.title));
      }
    }
    for (const t of state.tasks.filter((x) => x.status === 'pendiente' && x.dueDate === key && !x.scheduledEventId && (!areaFilter || x.areaId === areaFilter))) {
      rows.push(h('button', { type: 'button', class: 'item task', onclick: () => openTaskSheet(t) }, h('time', {}, 'Tarea'), t.title));
    }
    days.push(h('div', { class: `day${diffDays(today, day) === 0 ? ' is-today' : ''}` },
      h('h3', {}, `${WEEKDAYS[i][0].toUpperCase()}${WEEKDAYS[i].slice(1)}`, h('span', {}, shortDay(day))),
      rows.length ? rows : h('div', { class: 'item task' }, 'Libre')));
  }

  root.replaceChildren(
    h('div', { class: 'week-head' },
      h('button', { type: 'button', class: 'btn small', 'aria-label': 'Semana anterior', onclick: () => { weekOffset--; renderWeek(); } }, '‹'),
      h('strong', {}, `${shortDay(monday)} – ${shortDay(sunday)}`),
      h('button', { type: 'button', class: 'btn small', 'aria-label': 'Semana siguiente', onclick: () => { weekOffset++; renderWeek(); } }, '›')),
    h('div', { class: 'chips' },
      h('button', { type: 'button', class: `chip${areaFilter ? '' : ' is-on'}`, onclick: () => { areaFilter = null; renderWeek(); } }, 'Todas'),
      state.areas.map((a) => h('button', { type: 'button', class: `chip${areaFilter === a.id ? ' is-on' : ''}`, onclick: () => { areaFilter = a.id; renderWeek(); } }, a.name))),
    h('div', { class: 'row' },
      h('button', { type: 'button', class: 'btn small', onclick: () => openShiftsSheet(monday) }, 'Turnos'),
      h('button', { type: 'button', class: 'btn small', onclick: () => exportWeek(from, to, monday) }, 'Pasar al Calendario')),
    ...days,
    h('button', { type: 'button', class: 'fab', 'aria-label': 'Añadir evento', onclick: () => openEventSheet(null, weekOffset === 0 ? today : monday) }, '+'),
  );
}

/** @param {number} from @param {number} to @param {CivilDate} monday */
async function exportWeek(from, to, monday) {
  const items = busyBetween(state, from, to)
    .filter((b) => b.kind !== 'block')
    .map((b) => {
      const ev = b.kind === 'event' ? state.events.find((e) => e.id === b.id) : null;
      return { uid: b.id, title: b.kind === 'shift' ? 'Turno' : b.title, start: b.start, end: b.end, location: ev?.location ?? '', reminderMin: ev ? ev.reminderMin : 30 };
    });
  if (!items.length) { toast('Esta semana no hay nada que exportar.'); return; }
  await shareFile(buildIcs(items, Date.now()), `jarvis-${dayKey(monday)}.ics`, 'text/calendar');
}

/** @param {number} ms */
const dateInputValue = (ms) => dayKey(civilOf(ms));

/**
 * @param {CalEvent | null} ev
 * @param {CivilDate} defaultDay
 */
function openEventSheet(ev, defaultDay) {
  const start = ev ? Date.parse(ev.startsAt) : fromZoned(defaultDay, 10 * 60).getTime();
  const end = ev ? Date.parse(ev.endsAt) : start + 3_600_000;
  const f = {
    title: h('input', { type: 'text', value: ev?.title ?? '', required: true, maxLength: 120 }),
    day: h('input', { type: 'date', value: dateInputValue(start), required: true }),
    start: h('input', { type: 'time', value: fmtTime(start), required: true }),
    end: h('input', { type: 'time', value: fmtTime(end), required: true }),
    location: h('input', { type: 'text', value: ev?.location ?? '', maxLength: 120 }),
    area: h('select', {}, state.areas.map((a) => h('option', { value: a.id, selected: (ev?.areaId ?? 'personal') === a.id }, a.name))),
    important: h('input', { type: 'checkbox', checked: ev?.important ?? false }),
    reminder: h('input', { type: 'number', min: 0, max: 1440, value: String(ev?.reminderMin ?? state.settings.defaultReminderMin) }),
  };
  const form = h('form', { method: 'dialog' },
    h('h2', {}, ev ? 'Editar' : 'Nuevo evento'),
    h('label', { class: 'field' }, 'Qué', f.title),
    h('label', { class: 'field' }, 'Día', f.day),
    h('div', { class: 'row' }, h('label', { class: 'field grow' }, 'Empieza', f.start), h('label', { class: 'field grow' }, 'Acaba', f.end)),
    h('label', { class: 'field' }, 'Dónde', f.location),
    h('label', { class: 'field' }, 'Área', f.area),
    h('label', { class: 'check' }, f.important, 'Importante'),
    h('label', { class: 'field' }, 'Aviso previo (minutos)', f.reminder),
    h('div', { class: 'row' },
      h('button', { type: 'submit', class: 'btn primary grow' }, 'Guardar'),
      ev ? h('button', { type: 'button', class: 'btn danger', onclick: () => {
        if (!confirm(`¿Borrar «${ev.title}»?`)) return;
        const s = structuredClone(state);
        s.events = s.events.filter((e) => e.id !== ev.id);
        for (const t of s.tasks) if (t.scheduledEventId === ev.id) t.scheduledEventId = null;
        sheet.close();
        commit(s);
      } }, 'Borrar') : null,
      h('button', { type: 'button', class: 'btn', onclick: () => sheet.close() }, 'Cerrar')));
  form.addEventListener('submit', (/** @type {SubmitEvent} */ e) => {
    e.preventDefault();
    const day = parseDayKey(f.day.value);
    const sm = hhmmToMin(f.start.value);
    let em = hhmmToMin(f.end.value);
    if (!day || !Number.isFinite(sm) || !Number.isFinite(em)) { toast('Revisa el día y las horas.'); return; }
    if (em <= sm) em += 1440;
    const startsAt = fromZoned(day, sm).toISOString();
    const endsAt = fromZoned(day, em).toISOString();
    const ids = new Set(state.areas.map((a) => a.id));
    const clean = sanitizeEvent({
      ...(ev ?? {}), id: ev?.id ?? uid(), title: f.title.value, startsAt, endsAt, location: f.location.value,
      areaId: f.area.value, important: f.important.checked, reminderMin: Number(f.reminder.value),
      source: ev?.source ?? 'manual', updatedAt: new Date().toISOString(),
    }, ids);
    if (!clean) { toast('Faltan datos o las horas no cuadran.'); return; }
    const clash = conflicts(state, Date.parse(startsAt), Date.parse(endsAt), clean.id);
    if (clash.length && !confirm(`Choca con «${clash[0].title}» (${fmtTime(clash[0].start)}–${fmtTime(clash[0].end)}). ¿Guardar igualmente?`)) return;
    const s = structuredClone(state);
    s.events = [...s.events.filter((x) => x.id !== clean.id), clean];
    sheet.close();
    commit(s);
  });
  sheet.replaceChildren(form);
  sheet.showModal();
}

/** @param {CivilDate} monday */
function openShiftsSheet(monday) {
  const rows = [];
  /** @type {{ day: CivilDate, off: HTMLInputElement, t: HTMLInputElement[] }[]} */
  const fields = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(monday, i);
    const key = dayKey(day);
    const existing = state.shifts.filter((s) => s.day === key).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const off = h('input', { type: 'checkbox', checked: existing.some((s) => s.isDayOff) });
    const work = existing.filter((s) => !s.isDayOff);
    const t = [0, 1].flatMap((j) => [
      h('input', { type: 'time', value: work[j] ? fmtTime(work[j].startsAt) : '', 'aria-label': `Entrada ${j + 1}` }),
      h('input', { type: 'time', value: work[j] ? fmtTime(work[j].endsAt) : '', 'aria-label': `Salida ${j + 1}` }),
    ]);
    fields.push({ day, off, t });
    rows.push(h('div', { class: 'shift-row' },
      h('div', { class: 'row' }, h('strong', { class: 'grow' }, `${fmtLongDay(day)}`), h('label', { class: 'check' }, off, 'Libro')),
      h('div', { class: 'times' }, t[0], t[1]),
      h('div', { class: 'times' }, t[2], t[3])));
  }
  const form = h('form', { method: 'dialog' },
    h('h2', {}, 'Turnos de la semana'),
    h('p', { class: 'hint' }, 'Entrada y salida. La segunda línea es para turnos partidos. Si la salida es antes que la entrada, cruza la medianoche.'),
    h('div', { class: 'shift-grid' }, rows),
    h('div', { class: 'row' }, h('button', { type: 'submit', class: 'btn primary grow' }, 'Guardar'), h('button', { type: 'button', class: 'btn', onclick: () => sheet.close() }, 'Cerrar')));
  form.addEventListener('submit', (/** @type {SubmitEvent} */ e) => {
    e.preventDefault();
    const s = structuredClone(state);
    const now = new Date();
    const notes = [];
    for (const f of fields) {
      if (f.off.checked) { applyShifts(s, [f.day], [], true, now); continue; }
      const ranges = [];
      for (let j = 0; j < 2; j++) {
        const a = hhmmToMin(f.t[j * 2].value);
        let b = hhmmToMin(f.t[j * 2 + 1].value);
        if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
        if (b <= a) b += 1440;
        ranges.push({ startMin: a, endMin: b });
      }
      if (ranges.length) {
        const [msg] = applyShifts(s, [f.day], ranges, false, now);
        if (msg.includes('Ojo')) notes.push(msg);
      } else {
        s.shifts = s.shifts.filter((x) => x.day !== dayKey(f.day));
      }
    }
    sheet.close();
    commit(s);
    toast(notes.length ? `Guardado. ${notes[0]}` : 'Turnos guardados.');
  });
  sheet.replaceChildren(form);
  sheet.showModal();
}

/** @param {Task | null} task */
function openTaskSheet(task) {
  const f = {
    title: h('input', { type: 'text', value: task?.title ?? '', required: true, maxLength: 120 }),
    priority: h('select', {}, ['alta', 'media', 'baja'].map((p) => h('option', { value: p, selected: (task?.priority ?? 'media') === p }, p))),
    area: h('select', {}, state.areas.map((a) => h('option', { value: a.id, selected: (task?.areaId ?? 'personal') === a.id }, a.name))),
    due: h('input', { type: 'date', value: task?.dueDate ?? '' }),
    duration: h('input', { type: 'number', min: 5, max: 1440, value: String(task?.durationMin ?? 60) }),
  };
  const form = h('form', { method: 'dialog' },
    h('h2', {}, task ? 'Tarea' : 'Nueva tarea'),
    h('label', { class: 'field' }, 'Qué', f.title),
    h('div', { class: 'row' }, h('label', { class: 'field grow' }, 'Prioridad', f.priority), h('label', { class: 'field grow' }, 'Área', f.area)),
    h('div', { class: 'row' }, h('label', { class: 'field grow' }, 'Fecha límite', f.due), h('label', { class: 'field grow' }, 'Duración (min)', f.duration)),
    h('div', { class: 'row' },
      h('button', { type: 'submit', class: 'btn primary grow' }, 'Guardar'),
      task ? h('button', { type: 'button', class: 'btn', onclick: () => { sheet.close(); fitTask(task); } }, 'Buscar hueco') : null,
      task ? h('button', { type: 'button', class: 'btn danger', onclick: () => {
        if (!confirm(`¿Borrar la tarea «${task.title}»?`)) return;
        const s = structuredClone(state);
        s.tasks = s.tasks.filter((x) => x.id !== task.id);
        sheet.close();
        commit(s);
      } }, 'Borrar') : null));
  form.addEventListener('submit', (/** @type {SubmitEvent} */ e) => {
    e.preventDefault();
    const clean = sanitizeTask({
      ...(task ?? {}), id: task?.id ?? uid(), title: f.title.value, priority: f.priority.value, areaId: f.area.value,
      dueDate: f.due.value || null, durationMin: Number(f.duration.value),
    }, new Set(state.areas.map((a) => a.id)));
    if (!clean) { toast('Ponle un nombre a la tarea.'); return; }
    const s = structuredClone(state);
    s.tasks = [...s.tasks.filter((x) => x.id !== clean.id), clean];
    sheet.close();
    commit(s);
  });
  sheet.replaceChildren(form);
  sheet.showModal();
}

/** Busca hueco para una tarea reutilizando el diálogo, y lleva al chat para confirmar. @param {Task} task */
function fitTask(task) {
  showView('talk');
  const due = task.dueDate ? parseDayKey(task.dueDate) : null;
  const today = civilOf(new Date());
  const when = due && diffDays(today, due) >= 0 ? `antes del ${due.d} de ${MONTHS[due.m - 1]}` : 'esta semana';
  handleInput(`encájame ${task.title} ${when}`, 'texto');
}

function renderTasks() {
  const root = byId('view-tasks');
  const title = h('input', { type: 'text', placeholder: 'Nueva tarea…', maxLength: 120, 'aria-label': 'Nueva tarea' });
  const add = h('form', { class: 'composer' }, title, h('button', { type: 'submit', class: 'btn primary' }, 'Añadir'));
  add.addEventListener('submit', (/** @type {SubmitEvent} */ e) => {
    e.preventDefault();
    const clean = sanitizeTask({ title: title.value, areaId: inferArea(title.value, state.areas) }, new Set(state.areas.map((a) => a.id)));
    if (!clean) return;
    const s = structuredClone(state);
    s.tasks.push(clean);
    commit(s);
  });
  const order = { alta: 0, media: 1, baja: 2 };
  const pending = state.tasks.filter((t) => t.status === 'pendiente');
  /** @param {Task} t @param {boolean} done */
  const toggle = (t, done) => {
    const s = structuredClone(state);
    const x = s.tasks.find((y) => y.id === t.id);
    if (!x) return;
    x.status = done ? 'hecha' : 'pendiente';
    x.completedAt = done ? new Date().toISOString() : null;
    commit(s);
  };
  const groups = state.areas.map((a) => {
    const list = pending.filter((t) => t.areaId === a.id).sort((x, y) => order[x.priority] - order[y.priority] || (x.dueDate ?? '9').localeCompare(y.dueDate ?? '9'));
    if (!list.length) return null;
    return h('div', { class: 'card' }, h('h2', {}, a.name),
      h('ul', { class: 'list' }, list.map((t) => h('li', {},
        h('input', { type: 'checkbox', 'aria-label': `Marcar ${t.title} como hecha`, onchange: () => toggle(t, true) }),
        h('button', { type: 'button', class: 'task-title', onclick: () => openTaskSheet(t) }, t.title,
          t.dueDate ? h('small', {}, ` · ${fmtLongDay(/** @type {CivilDate} */ (parseDayKey(t.dueDate)))}`) : null,
          t.scheduledEventId ? h('small', {}, ' · encajada') : null),
        h('span', { class: `prio ${t.priority}` }, t.priority)))));
  });
  const done = state.tasks.filter((t) => t.status === 'hecha').sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')).slice(0, 10);
  root.replaceChildren(
    h('div', { class: 'card' }, add),
    ...(pending.length ? groups : [h('p', { class: 'empty' }, 'No tienes tareas pendientes.')]),
    done.length ? h('div', { class: 'card' }, h('h2', {}, 'Hechas'),
      h('ul', { class: 'list' }, done.map((t) => h('li', {},
        h('input', { type: 'checkbox', checked: true, 'aria-label': `Reabrir ${t.title}`, onchange: () => toggle(t, false) }),
        h('span', { class: 'grow' }, t.title))))) : null,
  );
}

// ---------------------------------------------------------------- ajustes

/**
 * @param {Partial<State['settings']>} patch
 */
function updateSettings(patch) {
  commit(sanitizeState({ ...state, settings: { ...state.settings, ...patch } }));
}

/** @param {string} label @param {keyof State['settings']} key */
function timeField(label, key) {
  return h('label', { class: 'field' }, label,
    h('input', { type: 'time', value: String(state.settings[key]), onchange: (/** @type {Event} */ e) => updateSettings({ [key]: /** @type {HTMLInputElement} */ (e.target).value }) }));
}

/** @param {string} label @param {'defaultReminderMin' | 'travelMin'} key @param {number} max */
function numberField(label, key, max) {
  return h('label', { class: 'field' }, label,
    h('input', { type: 'number', min: 0, max, value: String(state.settings[key]), onchange: (/** @type {Event} */ e) => updateSettings({ [key]: Math.round(Number(/** @type {HTMLInputElement} */ (e.target).value)) }) }));
}

async function startAI() {
  const support = await ai.webgpuSupport();
  if (!support.ok) {
    aiStatus.phase = 'unsupported';
    render();
    return;
  }
  aiStatus.phase = 'loading';
  aiStatus.progress = 0;
  render();
  try {
    await ai.loadModel(state.settings.aiModel, (progress, text) => {
      aiStatus.progress = progress;
      aiStatus.text = text;
      const bar = document.getElementById('ai-bar');
      if (bar) bar.style.width = `${Math.round(progress * 100)}%`;
      const label = document.getElementById('ai-text');
      if (label) label.textContent = text;
    });
    aiStatus.phase = 'ready';
  } catch (e) {
    aiStatus.phase = 'error';
    aiStatus.text = e instanceof Error ? e.message : 'Error desconocido';
  }
  render();
}

function aiCard() {
  const phaseText = {
    off: 'Desactivada. Jarvis funciona con su intérprete propio.',
    unsupported: 'Este iPhone no tiene WebGPU disponible en Safari, así que la IA local no puede funcionar. Jarvis sigue funcionando con su intérprete propio.',
    loading: 'Preparando la IA…',
    ready: 'Lista. Funciona dentro del iPhone, sin internet y sin enviar nada fuera.',
    error: `No se ha podido cargar: ${aiStatus.text}`,
  }[aiStatus.phase];
  const on = state.settings.aiEnabled;
  return h('div', { class: 'card' },
    h('h2', {}, 'IA en el iPhone'),
    h('p', {}, phaseText),
    aiStatus.phase === 'loading' ? [h('div', { class: 'progress' }, h('div', { id: 'ai-bar', style: `width:${Math.round(aiStatus.progress * 100)}%` })), h('p', { class: 'hint', id: 'ai-text' }, aiStatus.text)] : null,
    h('label', { class: 'field' }, 'Modelo',
      h('select', { disabled: aiStatus.phase === 'loading', onchange: (/** @type {Event} */ e) => {
        updateSettings({ aiModel: /** @type {'normal' | 'ligero'} */ (/** @type {HTMLSelectElement} */ (e.target).value) });
        if (state.settings.aiEnabled) startAI();
      } }, Object.entries(ai.MODELS).map(([k, m]) => h('option', { value: k, selected: state.settings.aiModel === k }, m.label)))),
    h('p', { class: 'hint' }, 'La primera vez descarga el modelo (mejor con wifi). Después queda guardado en el teléfono.'),
    h('div', { class: 'row' },
      on
        ? h('button', { type: 'button', class: 'btn', onclick: async () => { updateSettings({ aiEnabled: false }); await ai.unloadModel(); aiStatus.phase = 'off'; render(); } }, 'Desactivar')
        : h('button', { type: 'button', class: 'btn primary', onclick: () => { updateSettings({ aiEnabled: true }); startAI(); } }, 'Activar IA'),
      h('button', { type: 'button', class: 'btn danger', disabled: aiStatus.phase === 'loading', onclick: async () => {
        if (!confirm('¿Borrar los modelos descargados? Tendrás que volver a descargarlos para usar la IA.')) return;
        try { await ai.deleteDownloadedModels(); toast('Modelos borrados.'); } catch { toast('No se han podido borrar ahora.'); }
        updateSettings({ aiEnabled: false });
        aiStatus.phase = 'off';
        render();
      } }, 'Borrar modelo')));
}

function renderSettings() {
  const root = byId('view-settings');
  const s = state.settings;
  const voices = spanishVoices();
  const active = pickVoice(s.voiceURI);
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const newArea = h('input', { type: 'text', placeholder: 'Nueva área', maxLength: 30 });
  const importInput = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: async (/** @type {Event} */ e) => {
    const file = /** @type {HTMLInputElement} */ (e.target).files?.[0];
    if (!file) return;
    try {
      const next = sanitizeState(JSON.parse(await file.text()));
      if (confirm(`Se reemplazarán tus datos por la copia (${next.events.length} eventos, ${next.tasks.length} tareas). ¿Seguir?`)) commit(next);
    } catch {
      toast('Ese archivo no es una copia válida.');
    }
  } });

  root.replaceChildren(
    h('div', { class: 'card' },
      h('h2', {}, 'Asistente'),
      h('label', { class: 'field' }, 'Nombre',
        h('input', { type: 'text', value: s.assistantName, maxLength: 30, onchange: (/** @type {Event} */ e) => updateSettings({ assistantName: /** @type {HTMLInputElement} */ (e.target).value }) })),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: s.speak, onchange: (/** @type {Event} */ e) => updateSettings({ speak: /** @type {HTMLInputElement} */ (e.target).checked }) }), 'Responder en voz alta'),
      h('label', { class: 'field' }, 'Voz',
        h('select', { onchange: (/** @type {Event} */ e) => updateSettings({ voiceURI: /** @type {HTMLSelectElement} */ (e.target).value }) },
          h('option', { value: '', selected: !s.voiceURI }, 'Automática (la mejor en español)'),
          voices.map((v) => h('option', { value: v.voiceURI, selected: v.voiceURI === s.voiceURI }, `${v.name} (${v.lang})`)))),
      h('p', { class: 'hint' }, `Voz activa: ${active ? active.name : 'ninguna en español instalada'}.`),
      h('p', { class: 'hint' }, 'Para una voz más natural: Ajustes del iPhone › Accesibilidad › Contenido leído › Voces › Español (España), descarga una voz «Mejorada» y elígela aquí.'),
      h('button', { type: 'button', class: 'btn small', onclick: () => { unlockAudio(); speak(`Hola, soy ${s.assistantName}. Así sueno.`, s.voiceURI); } }, 'Probar voz')),
    aiCard(),
    h('div', { class: 'card' },
      h('h2', {}, 'Horarios'),
      h('div', { class: 'row' }, h('div', { class: 'grow' }, timeField('Me levanto', 'sleepEnd')), h('div', { class: 'grow' }, timeField('Me acuesto', 'sleepStart'))),
      h('div', { class: 'row' }, h('div', { class: 'grow' }, timeField('Silencio desde', 'quietStart')), h('div', { class: 'grow' }, timeField('Silencio hasta', 'quietEnd'))),
      timeField('Aviso de la víspera', 'nightlyHour'),
      h('div', { class: 'row' },
        h('label', { class: 'field grow' }, 'Resumen semanal',
          h('select', { onchange: (/** @type {Event} */ e) => updateSettings({ weeklyDay: Number(/** @type {HTMLSelectElement} */ (e.target).value) }) },
            WEEKDAYS.map((d, i) => h('option', { value: String(i), selected: s.weeklyDay === i }, d)))),
        h('div', { class: 'grow' }, timeField('a las', 'weeklyHour'))),
      h('div', { class: 'row' }, h('div', { class: 'grow' }, numberField('Aviso previo (min)', 'defaultReminderMin', 1440)), h('div', { class: 'grow' }, numberField('Desplazamiento (min)', 'travelMin', 180)))),
    h('div', { class: 'card' },
      h('h2', {}, 'Áreas'),
      h('ul', { class: 'list' }, state.areas.map((a) => h('li', {},
        h('input', { type: 'color', value: a.color, 'aria-label': `Color de ${a.name}`, onchange: (/** @type {Event} */ e) => {
          commit(sanitizeState({ ...state, areas: state.areas.map((x) => (x.id === a.id ? { ...x, color: /** @type {HTMLInputElement} */ (e.target).value } : x)) }));
        } }),
        h('input', { type: 'text', value: a.name, maxLength: 30, class: 'grow', onchange: (/** @type {Event} */ e) => {
          commit(sanitizeState({ ...state, areas: state.areas.map((x) => (x.id === a.id ? { ...x, name: /** @type {HTMLInputElement} */ (e.target).value } : x)) }));
        } }),
        a.id === 'personal' ? null : h('button', { type: 'button', class: 'btn small danger', onclick: () => {
          if (!confirm(`¿Quitar el área «${a.name}»? Lo que tenga pasa a Personal.`)) return;
          commit(sanitizeState({ ...state, areas: state.areas.filter((x) => x.id !== a.id) }));
        } }, 'Quitar')))),
      h('form', { class: 'composer', onsubmit: (/** @type {SubmitEvent} */ e) => {
        e.preventDefault();
        const name = newArea.value.trim();
        if (!name) return;
        commit(sanitizeState({ ...state, areas: [...state.areas, { id: uid(), name, color: '#e0a800', isDefault: false }] }));
      } }, newArea, h('button', { type: 'submit', class: 'btn' }, 'Añadir'))),
    h('div', { class: 'card' },
      h('h2', {}, 'Memoria'),
      state.memories.length
        ? h('ul', { class: 'list' }, state.memories.map((m) => h('li', {},
          m.category === 'dato'
            ? h('input', { type: 'text', value: m.content, class: 'grow', maxLength: 300, onchange: (/** @type {Event} */ e) => {
              commit(sanitizeState({ ...state, memories: state.memories.map((x) => (x.id === m.id ? { ...x, content: /** @type {HTMLInputElement} */ (e.target).value } : x)) }));
            } })
            : h('span', { class: 'grow' }, m.content),
          h('button', { type: 'button', class: 'btn small danger', onclick: () => {
            if (confirm('¿Olvidar esto?')) commit({ ...state, memories: state.memories.filter((x) => x.id !== m.id) });
          } }, 'Borrar'))))
        : h('p', { class: 'hint' }, 'Aún no me has contado nada duradero. Prueba con «no me pongas nada antes de las 9».')),
    h('div', { class: 'card' },
      h('h2', {}, 'Avisos'),
      h('p', {}, perm === 'granted' ? 'Activados.' : perm === 'denied' ? 'Bloqueados en los ajustes del iPhone.' : perm === 'unsupported' ? 'Este navegador no admite avisos.' : 'Sin activar.'),
      perm === 'default'
        ? (isStandalone()
          ? h('button', { type: 'button', class: 'btn primary', onclick: async () => { await Notification.requestPermission(); render(); } }, 'Activar avisos')
          : h('p', { class: 'hint' }, 'Primero instala la app en la pantalla de inicio; iOS solo permite avisos desde ahí.'))
        : null,
      h('p', { class: 'hint' }, 'Te aviso mientras la app está abierta o recién cerrada. Para que los avisos suenen con la app cerrada del todo, usa «Añadir al Calendario» en Semana: el Calendario del iPhone se encarga de avisarte.')),
    h('div', { class: 'card' },
      h('h2', {}, 'Tus datos'),
      h('p', { class: 'hint' }, 'Todo se guarda solo en este iPhone. Haz una copia de vez en cuando: si borras la app, se borran los datos.'),
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'btn', onclick: () => shareFile(JSON.stringify(state, null, 2), `jarvis-copia-${dayKey(civilOf(Date.now()))}.json`, 'application/json') }, 'Exportar copia'),
        h('button', { type: 'button', class: 'btn', onclick: () => importInput.click() }, 'Importar copia'),
        importInput),
      h('button', { type: 'button', class: 'btn danger', onclick: () => {
        if (!confirm('¿Borrar todos tus datos de Jarvis? No se puede deshacer.')) return;
        const fresh = createState();
        fresh.settings.onboarded = true;
        commit(fresh);
      } }, 'Borrar todo')),
    h('p', { class: 'hint' }, `${s.assistantName} ${APP_VERSION} · Sin cuentas, sin claves, sin servidores.`),
  );
}

// ---------------------------------------------------------------- vistas

/** @param {string} name */
function showView(name) {
  view = name;
  for (const b of document.querySelectorAll('.tabs button')) b.classList.toggle('is-active', /** @type {HTMLElement} */ (b).dataset.view === name);
  for (const v of document.querySelectorAll('.view')) v.classList.toggle('is-active', v.id === `view-${name}`);
  render();
}
for (const b of document.querySelectorAll('.tabs button')) {
  b.addEventListener('click', () => showView(/** @type {HTMLElement} */ (b).dataset.view ?? 'talk'));
}

// ---------------------------------------------------------------- bienvenida

function renderOnboarding() {
  const root = byId('onboarding');
  if (state.settings.onboarded) { root.hidden = true; return; }
  const start = () => {
    unlockAudio();
    const s = structuredClone(state);
    s.settings.onboarded = true;
    commit(s);
    root.hidden = true;
    proactiveTick();
  };
  root.hidden = false;
  root.replaceChildren(
    h('h2', {}, `Hola, soy ${state.settings.assistantName}`),
    h('p', {}, 'Llevo tu agenda, tus turnos y tus tareas. Me hablas o me escribes como a una persona.'),
    isStandalone()
      ? h('p', {}, 'Pulsa «Empezar» para activar el sonido (el iPhone lo exige con un toque).')
      : h('div', {},
        h('p', {}, 'Para tenerme como una app, instálame:'),
        h('ol', {},
          h('li', {}, 'Pulsa el botón Compartir de Safari (el cuadrado con la flecha hacia arriba).'),
          h('li', {}, 'Elige «Añadir a pantalla de inicio» y confirma.'),
          h('li', {}, 'Abre Jarvis desde el icono nuevo.'))),
    h('button', { type: 'button', class: 'btn primary', onclick: start }, isStandalone() ? 'Empezar' : 'Seguir en el navegador'),
  );
}

// ---------------------------------------------------------------- proactividad

/** @param {string} title @param {string} body @param {string} tag */
async function notify(title, body, tag) {
  if ('Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, { body, tag, icon: 'icons/icon-192.png' });
      return;
    } catch { /* se muestra dentro de la app */ }
  }
  if (document.visibilityState === 'visible') toast(body);
}

function proactiveTick() {
  if (!state.settings.onboarded) return;
  const now = new Date();
  let s = state;
  let changed = false;
  const brief = morningBriefing(s, now);
  if (brief) { s = withMessage(brief.state, 'assistant', brief.text); changed = true; }
  const digest = scheduledDigest(s, now);
  if (digest) {
    s = withMessage(digest.state, 'assistant', digest.text);
    changed = true;
    notify(state.settings.assistantName, digest.text, `${digest.kind}-${dayKey(civilOf(now))}`);
  }
  const rem = dueReminders(s, now);
  if (rem.due.length) {
    s = rem.state;
    changed = true;
    for (const d of rem.due) {
      s = withMessage(s, 'assistant', `Recordatorio: ${d.text}`);
      notify('Recordatorio', d.text, d.key);
    }
  }
  if (changed) commit(s);
  else renderPending();
  if (brief) say(brief.speak);
}

// ---------------------------------------------------------------- service worker

function showUpdate(/** @type {ServiceWorker} */ worker) {
  const banner = byId('update-banner');
  banner.hidden = false;
  byId('update-btn').onclick = () => worker.postMessage({ type: 'SKIP_WAITING' });
}

if ('serviceWorker' in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    location.reload();
  });
  navigator.serviceWorker.register('sw.js').then((reg) => {
    if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) showUpdate(w);
      });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update().catch(() => {});
    });
  }).catch(() => { /* sin service worker la app funciona igual, sin modo offline */ });
}

// ---------------------------------------------------------------- arranque

document.addEventListener('pointerdown', unlockAudio, { once: true });
onVoicesChanged(() => { if (view === 'settings') renderSettings(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') proactiveTick(); });
setInterval(proactiveTick, 30_000);

if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});

const crashed = ai.takeCrashedLoad();
if (crashed === 'normal') {
  state = sanitizeState({ ...state, settings: { ...state.settings, aiModel: 'ligero' } });
  saveState(localStorage, state);
  toast('La IA normal no cabía en la memoria del iPhone. He pasado a la ligera.');
} else if (crashed === 'ligero') {
  state = sanitizeState({ ...state, settings: { ...state.settings, aiEnabled: false } });
  saveState(localStorage, state);
  toast('La IA no cabe en la memoria de este iPhone. Sigo con el intérprete propio.');
}

render();
renderOnboarding();
proactiveTick();
if (state.settings.aiEnabled) startAI();


// @ts-check
// Diálogo del asistente: recibe una frase y el estado, devuelve el estado nuevo y
// qué decir. Mover, borrar o reprogramar siempre pasa por una acción pendiente
// que caduca a los 10 minutos.

import { busyBetween, conflicts, dayLoads, freeSlots, inQuietHours, nearestSlot, planDay, shiftAt } from './agenda.js';
import { normalize, parse } from './nlu.js';
import { uid } from './store.js';
import {
  addDays, civilOf, dayEnd, dayKey, dayStart, diffDays, fmtRelativeDay, fmtTime, fromZoned, hhmmToMin,
  minToHhmm, minutesOfDay, MIN, startOfWeek, weekday, WEEKDAYS,
} from './time.js';

/** @typedef {import('./store.js').State} State */
/** @typedef {import('./store.js').CalEvent} CalEvent */
/** @typedef {import('./store.js').Pending} Pending */
/** @typedef {import('./time.js').CivilDate} CivilDate */
/** @typedef {{ state: State, reply: string, speak: string, understood: boolean }} Result */

export const PENDING_TTL_MIN = 10;

const AREA_HINTS = /** @type {Record<string, string[]>} */ ({
  trabajo: ['turno', 'curro', 'trabajo', 'jefe', 'encargado', 'restaurante', 'hotel', 'cocina', 'sala', 'nomina'],
  kael: ['kael', 'barco', 'barcos', 'nautico', 'puerto', 'amarre', 'charter', 'embarcacion'],
  hilo: ['hilo', 'candidato', 'candidatos', 'reclutamiento', 'oferta de empleo', 'cv'],
  estudios: ['clase', 'examen', 'fp', 'ciclo', 'estudiar', 'deberes', 'practica', 'practicas', 'profesor', 'tutoria', 'modulo', 'trabajo de clase'],
});

/**
 * @param {string} text
 * @param {State['areas']} areas
 */
export function inferArea(text, areas) {
  const t = ` ${normalize(text).replace(/\s+/g, ' ')} `;
  const custom = areas.find((a) => !a.isDefault && t.includes(` ${normalize(a.name).trim()} `));
  if (custom) return custom.id;
  for (const a of areas) {
    const words = AREA_HINTS[a.id] ?? [normalize(a.name).trim()];
    if (words.some((w) => t.includes(` ${w} `))) return a.id;
  }
  return 'personal';
}

/** @param {number} ms @param {Date} now */
function when(ms, now) {
  return `${fmtRelativeDay(civilOf(ms), civilOf(now))} a las ${fmtTime(ms)}`;
}

/** @param {string} s */
const lower = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);
/** @param {string} s */
const upper = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/**
 * @param {State} state
 * @param {Pending['kind']} kind
 * @param {any} payload
 * @param {string} summary
 * @param {Date} now
 */
function propose(state, kind, payload, summary, now) {
  state.pending = { id: uid(), kind, payload, summary, expiresAt: new Date(now.getTime() + PENDING_TTL_MIN * MIN).toISOString() };
}

/** @param {string} hint @param {string} title */
function matchesHint(hint, title) {
  const words = hint.split(' ').filter((w) => w.length >= 3);
  if (!words.length) return true;
  const t = normalize(title);
  return words.some((w) => t.includes(w));
}

/**
 * Eventos candidatos para mover o borrar.
 * @param {State} state
 * @param {CivilDate | null} day
 * @param {string} hint
 * @param {Date} now
 */
function findEvents(state, day, hint, now) {
  const from = day ? dayStart(day).getTime() : now.getTime() - 60 * MIN;
  const to = day ? dayEnd(day).getTime() : now.getTime() + 60 * 86_400_000;
  const inRange = state.events.filter((e) => Date.parse(e.startsAt) < to && Date.parse(e.endsAt) > from);
  const hinted = hint ? inRange.filter((e) => matchesHint(hint, e.title)) : inRange;
  return hinted.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/** @param {ReturnType<typeof conflicts>[number]} b @param {Date} now */
function describeBusy(b, now) {
  if (b.kind === 'shift') return `estás de turno (${fmtTime(b.start)}–${fmtTime(b.end)})`;
  if (b.kind === 'block') return `tienes ${lower(b.title)} (${fmtTime(b.start)}–${fmtTime(b.end)})`;
  return `ya tienes ${lower(b.title)} ${when(b.start, now).replace(/^.* a las /, 'a las ')}`;
}

/**
 * @param {State} state
 * @param {string} text
 * @param {Date} now
 * @param {{ source?: 'voz' | 'texto' }} [opts]
 * @returns {Result}
 */
export function respond(state, text, now, opts = {}) {
  const s = structuredClone(state);
  if (s.pending && Date.parse(s.pending.expiresAt) <= now.getTime()) s.pending = null;
  const intent = parse(text, now, { assistantName: s.settings.assistantName });
  const source = opts.source ?? 'texto';
  /** @param {string} reply @param {string} [speak] */
  const ok = (reply, speak) => ({ state: s, reply, speak: speak ?? reply, understood: true });

  switch (intent.type) {
    case 'confirm': {
      if (!s.pending) {
        const hadExpired = state.pending !== null;
        return ok(hadExpired ? 'Eso ya caducó. Dímelo otra vez y lo miro.' : 'No tengo nada pendiente de confirmar.');
      }
      return execute(s, now);
    }
    case 'cancel': {
      const had = s.pending !== null;
      s.pending = null;
      return ok(had ? 'Vale, lo dejo como estaba.' : 'Vale.');
    }
    case 'greeting':
      return ok(`Aquí estoy. ¿Qué necesitas?`);
    case 'thanks':
      return ok('A mandar.');
    case 'help':
      return ok(
        'Puedes decirme cosas como «el jueves a las cinco tengo banco», «pásame lo del martes al miércoles», «¿qué tengo esta semana?», «organízame el viernes», «trabajo el lunes de 16 a 24» o «no me pongas nada antes de las 9».',
        'Dime lo que tengas que hacer y cuándo, y yo lo cuadro con tus turnos.',
      );
    case 'clarify':
      return ok(intent.question);

    case 'event': {
      const start = fromZoned(intent.date, intent.startMin).getTime();
      const end = fromZoned(intent.date, intent.endMin).getTime();
      if (end <= start) return ok('Esa franja no me cuadra: la hora de fin va antes que la de inicio.');
      /** @type {CalEvent} */
      const ev = {
        id: uid(), title: intent.title, startsAt: new Date(start).toISOString(), endsAt: new Date(end).toISOString(),
        location: intent.location, areaId: inferArea(text, s.areas), important: intent.important,
        reminderMin: s.settings.defaultReminderMin, source, createdAt: now.toISOString(), updatedAt: now.toISOString(),
      };
      if (start < now.getTime()) {
        const summary = `${upper(when(start, now))} ya ha pasado. ¿Lo apunto igual?`;
        propose(s, 'create_event', ev, summary, now);
        return ok(summary);
      }
      const clash = conflicts(s, start, end);
      if (clash.length) {
        const alt = nearestSlot(s, intent.date, Math.round((end - start) / MIN), now, start);
        const base = `${upper(when(start, now))} ${describeBusy(clash[0], now)}.`;
        if (!alt) return ok(`${base} Ese día no te veo otro hueco. Dime otra hora u otro día.`);
        const moved = { ...ev, startsAt: new Date(alt.start).toISOString(), endsAt: new Date(alt.end).toISOString() };
        const summary = `${base} ¿Te pongo ${lower(ev.title)} a las ${fmtTime(alt.start)}?`;
        propose(s, 'create_event', moved, summary, now);
        return ok(summary);
      }
      s.events.push(ev);
      return ok(`Hecho: ${lower(ev.title)}, ${when(start, now)}.`);
    }

    case 'task': {
      const due = intent.due ? dayKey(intent.due) : null;
      const key = normalize(intent.title).trim();
      let task = s.tasks.find((t) => t.status === 'pendiente' && normalize(t.title).trim() === key);
      if (!task) {
        task = {
          id: uid(), title: intent.title, dueDate: due, priority: intent.priority, status: 'pendiente',
          areaId: inferArea(text, s.areas), scheduledEventId: null, durationMin: intent.durationMin,
          createdAt: now.toISOString(), completedAt: null,
        };
        s.tasks.push(task);
      } else if (due) {
        task.dueDate = due;
      }
      if (!intent.fit) return ok(`Apuntado: ${lower(task.title)}.`);
      const today = civilOf(now);
      const from = intent.from && diffDays(today, intent.from) > 0 ? intent.from : today;
      const to = intent.due ?? addDays(today, 6);
      const [slot] = freeSlots(s, from, to, task.durationMin, now, 1);
      if (!slot) return ok(`Apuntado: ${lower(task.title)}. No te veo un hueco de ${task.durationMin} minutos antes de ${fmtRelativeDay(to, today)}; si quieres, dime tú cuándo.`);
      const summary = `Apuntado. Te veo libre ${when(slot.start, now)}. ¿Te encajo ahí ${lower(task.title)}?`;
      propose(s, 'schedule_task', { taskId: task.id, start: slot.start, end: slot.end }, summary, now);
      return ok(summary);
    }

    case 'query':
      return ok(...describeRange(s, intent.from, intent.to, now));

    case 'organize': {
      const plan = planDay(s, intent.date, now);
      const dayName = fmtRelativeDay(intent.date, civilOf(now));
      if (!plan.length) {
        const pendingCount = s.tasks.filter((t) => t.status === 'pendiente' && !t.scheduledEventId).length;
        return ok(pendingCount ? `${upper(dayName)} no te queda hueco para meter tareas.` : `No tienes tareas pendientes que encajar ${dayName}.`);
      }
      const lines = plan.map((p) => `· ${fmtTime(p.start)}–${fmtTime(p.end)} ${p.title}`).join('\n');
      propose(s, 'plan', plan, `Plan para ${dayName}`, now);
      const first = plan[0];
      return ok(
        `Para ${dayName} te propongo:\n${lines}\n¿Te lo dejo así?`,
        `Te propongo meter ${plan.length === 1 ? 'una tarea' : `${plan.length} tareas`} ${dayName}, empezando por ${lower(first.title)} a las ${fmtTime(first.start)}. ¿Te lo dejo así?`,
      );
    }

    case 'move': {
      const candidates = findEvents(s, intent.from, intent.hint, now);
      const where = intent.from ? fmtRelativeDay(intent.from, civilOf(now)) : '';
      if (!candidates.length) return ok(`No encuentro nada ${where || 'con ese nombre'} que mover.`.replace('  ', ' '));
      if (candidates.length > 1) {
        const names = candidates.slice(0, 3).map((e) => `${lower(e.title)} a las ${fmtTime(e.startsAt)}`);
        return ok(`${upper(where || 'ahí')} tienes ${names.join(' y ')}. ¿Cuál muevo?`);
      }
      const ev = candidates[0];
      const oldStart = Date.parse(ev.startsAt);
      const dur = Date.parse(ev.endsAt) - oldStart;
      if (!intent.to && intent.toMin === null) return ok(`¿A cuándo paso ${lower(ev.title)}?`);
      const day = intent.to ?? civilOf(oldStart);
      const newStart = fromZoned(day, intent.toMin ?? minutesOfDay(oldStart)).getTime();
      const newEnd = newStart + dur;
      if (newStart < now.getTime()) return ok(`Eso ya ha pasado. Dime otro día u otra hora para ${lower(ev.title)}.`);
      const clash = conflicts(s, newStart, newEnd, ev.id);
      if (clash.length) {
        const alt = nearestSlot(s, day, Math.round(dur / MIN), now, newStart, ev.id);
        const base = `${upper(when(newStart, now))} ${describeBusy(clash[0], now)}.`;
        if (!alt) return ok(`${base} Ese día no te veo hueco para ${lower(ev.title)}.`);
        const summary = `${base} ¿Paso ${lower(ev.title)} a las ${fmtTime(alt.start)}?`;
        propose(s, 'update_event', { id: ev.id, startsAt: new Date(alt.start).toISOString(), endsAt: new Date(alt.start + dur).toISOString() }, summary, now);
        return ok(summary);
      }
      const summary = `¿Paso ${lower(ev.title)} a ${when(newStart, now)}?`;
      propose(s, 'update_event', { id: ev.id, startsAt: new Date(newStart).toISOString(), endsAt: new Date(newEnd).toISOString() }, summary, now);
      return ok(summary);
    }

    case 'delete': {
      const evs = findEvents(s, intent.date, intent.hint, now);
      const tasks = intent.date ? [] : s.tasks.filter((t) => t.status === 'pendiente' && intent.hint && matchesHint(intent.hint, t.title));
      if (evs.length + tasks.length === 0) return ok('No encuentro qué borrar. Dime el nombre o el día.');
      if (evs.length + tasks.length > 1 && (evs.length > 1 || !intent.hint)) {
        const names = [...evs.map((e) => `${lower(e.title)} ${when(Date.parse(e.startsAt), now)}`), ...tasks.map((t) => `la tarea ${lower(t.title)}`)].slice(0, 3);
        return ok(`Tengo ${names.join(', ')}. ¿Cuál borro?`);
      }
      if (evs.length) {
        const ev = evs[0];
        const summary = `¿Borro ${lower(ev.title)} de ${when(Date.parse(ev.startsAt), now)}?`;
        propose(s, 'delete_event', { id: ev.id }, summary, now);
        return ok(summary);
      }
      const summary = `¿Borro la tarea ${lower(tasks[0].title)}?`;
      propose(s, 'delete_task', { id: tasks[0].id }, summary, now);
      return ok(summary);
    }

    case 'complete': {
      const matches = s.tasks.filter((t) => t.status === 'pendiente' && intent.hint && matchesHint(intent.hint, t.title));
      if (!matches.length) return ok('No encuentro esa tarea entre las pendientes.');
      if (matches.length > 1) return ok(`Tengo ${matches.slice(0, 3).map((t) => lower(t.title)).join(' y ')}. ¿Cuál tacho?`);
      matches[0].status = 'hecha';
      matches[0].completedAt = now.toISOString();
      return ok(`Tachado: ${lower(matches[0].title)}.`);
    }

    case 'shift':
      return ok(...applyShifts(s, intent.days, intent.ranges, intent.dayOff, now));

    case 'pref': {
      const kind = intent.rule.kind;
      s.memories = s.memories.filter((m) => m.rule?.kind !== kind);
      const label = kind === 'earliest' ? `nada antes de las ${minToHhmm(intent.rule.minutes)}` : `nada después de las ${minToHhmm(intent.rule.minutes)}`;
      s.memories.push({ id: uid(), content: upper(label), category: 'preferencia', rule: intent.rule, createdAt: now.toISOString() });
      return ok(`Anotado: ${label}. Lo tendré en cuenta.`);
    }

    case 'recurring': {
      const days = intent.weekdays.map((d) => WEEKDAYS[d]).join(' y ');
      const content = `Los ${days} de ${minToHhmm(intent.startMin)} a ${minToHhmm(intent.endMin)}: ${lower(intent.title)}`;
      s.memories.push({ id: uid(), content, category: 'bloque', rule: { kind: 'recurring', weekdays: intent.weekdays, startMin: intent.startMin, endMin: intent.endMin, title: intent.title }, createdAt: now.toISOString() });
      return ok(`Anotado: ${lower(content)}. No te pondré nada encima.`);
    }

    case 'memory': {
      if (!intent.content) return ok('¿Qué quieres que recuerde?');
      s.memories.push({ id: uid(), content: intent.content, category: 'dato', rule: null, createdAt: now.toISOString() });
      return ok('Me lo guardo.');
    }

    default:
      return { state: s, reply: 'No te he pillado. Prueba con algo como «el jueves a las cinco, banco».', speak: 'No te he pillado. ¿Me lo dices de otra forma?', understood: false };
  }
}

/**
 * Ejecuta la acción pendiente tras un "sí".
 * @param {State} s copia ya clonada
 * @param {Date} now
 * @returns {Result}
 */
function execute(s, now) {
  const p = /** @type {Pending} */ (s.pending);
  s.pending = null;
  /** @param {string} reply @param {string} [speak] */
  const ok = (reply, speak) => ({ state: s, reply, speak: speak ?? reply, understood: true });
  switch (p.kind) {
    case 'create_event': {
      /** @type {CalEvent} */
      const ev = p.payload;
      const start = Date.parse(ev.startsAt);
      const clash = start >= now.getTime() ? conflicts(s, start, Date.parse(ev.endsAt)) : [];
      if (clash.length) return ok(`Mientras tanto se ha ocupado esa hora: ${describeBusy(clash[0], now)}. Dime otra.`);
      s.events.push({ ...ev, updatedAt: now.toISOString() });
      return ok(`Hecho: ${lower(ev.title)}, ${when(start, now)}.`);
    }
    case 'update_event': {
      const ev = s.events.find((e) => e.id === p.payload.id);
      if (!ev) return ok('Ese evento ya no existe.');
      const start = Date.parse(p.payload.startsAt);
      const end = Date.parse(p.payload.endsAt);
      const clash = conflicts(s, start, end, ev.id);
      if (clash.length) return ok(`Mientras tanto se ha ocupado esa hora: ${describeBusy(clash[0], now)}.`);
      ev.startsAt = p.payload.startsAt;
      ev.endsAt = p.payload.endsAt;
      ev.updatedAt = now.toISOString();
      return ok(`Movido: ${lower(ev.title)}, ${when(start, now)}.`);
    }
    case 'delete_event': {
      const ev = s.events.find((e) => e.id === p.payload.id);
      if (!ev) return ok('Ese evento ya no estaba.');
      s.events = s.events.filter((e) => e.id !== ev.id);
      for (const t of s.tasks) if (t.scheduledEventId === ev.id) t.scheduledEventId = null;
      return ok(`Borrado: ${lower(ev.title)}.`);
    }
    case 'delete_task': {
      const t = s.tasks.find((x) => x.id === p.payload.id);
      if (!t) return ok('Esa tarea ya no estaba.');
      s.tasks = s.tasks.filter((x) => x.id !== t.id);
      if (t.scheduledEventId) s.events = s.events.filter((e) => e.id !== t.scheduledEventId);
      return ok(`Borrada: ${lower(t.title)}.`);
    }
    case 'schedule_task':
    case 'plan': {
      /** @type {{ taskId: string, start: number, end: number }[]} */
      const items = p.kind === 'plan' ? p.payload : [p.payload];
      const done = [];
      for (const it of items) {
        const task = s.tasks.find((t) => t.id === it.taskId);
        if (!task || task.status !== 'pendiente' || conflicts(s, it.start, it.end).length) continue;
        const ev = {
          id: uid(), title: task.title, startsAt: new Date(it.start).toISOString(), endsAt: new Date(it.end).toISOString(),
          location: '', areaId: task.areaId, important: task.priority === 'alta', reminderMin: s.settings.defaultReminderMin,
          source: /** @type {const} */ ('texto'), createdAt: now.toISOString(), updatedAt: now.toISOString(),
        };
        s.events.push(ev);
        task.scheduledEventId = ev.id;
        done.push({ title: task.title, start: it.start });
      }
      if (!done.length) return ok('No he podido encajarlo: esos huecos ya no están libres.');
      if (done.length === 1) return ok(`Hecho: ${lower(done[0].title)}, ${when(done[0].start, now)}.`);
      return ok(`Hecho, te he organizado ${done.length} tareas.`);
    }
    default:
      return ok('No sé ejecutar eso.');
  }
}

/**
 * Guarda turnos del día (sustituyen a los que hubiera) y avisa de choques.
 * @param {State} s
 * @param {CivilDate[]} days
 * @param {{ startMin: number, endMin: number }[]} ranges
 * @param {boolean} dayOff
 * @param {Date} now
 * @returns {[string, string]}
 */
export function applyShifts(s, days, ranges, dayOff, now) {
  const today = civilOf(now);
  const clashes = [];
  for (const day of days) {
    const key = dayKey(day);
    s.shifts = s.shifts.filter((x) => x.day !== key);
    if (dayOff) {
      const at = dayStart(day).toISOString();
      s.shifts.push({ id: uid(), day: key, startsAt: at, endsAt: at, isDayOff: true });
      continue;
    }
    for (const r of ranges) {
      const start = fromZoned(day, r.startMin).getTime();
      const end = fromZoned(day, r.endMin).getTime();
      s.shifts.push({ id: uid(), day: key, startsAt: new Date(start).toISOString(), endsAt: new Date(end).toISOString(), isDayOff: false });
      clashes.push(...s.events.filter((e) => Date.parse(e.startsAt) < end && Date.parse(e.endsAt) > start));
    }
  }
  const dayNames = days.map((d) => fmtRelativeDay(d, today)).join(' y ');
  if (dayOff) return [`Anotado: libras ${dayNames}.`, `Anotado, libras ${dayNames}.`];
  const franjas = ranges.map((r) => `de ${minToHhmm(r.startMin)} a ${r.endMin === 1440 ? '24:00' : minToHhmm(r.endMin)}`).join(' y ');
  let reply = `Anotado: ${dayNames} trabajas ${franjas}.`;
  if (clashes.length) reply += ` Ojo, choca con ${lower(clashes[0].title)} (${fmtTime(clashes[0].startsAt)}). ¿Lo muevo?`;
  return [reply, reply];
}

/**
 * Resumen de un rango: detallado en pantalla, en dos frases para la voz.
 * @param {State} s
 * @param {CivilDate} from
 * @param {CivilDate} to
 * @param {Date} now
 * @returns {[string, string]}
 */
export function describeRange(s, from, to, now) {
  const today = civilOf(now);
  const start = Math.max(dayStart(from).getTime(), diffDays(today, from) <= 0 ? now.getTime() - 30 * MIN : 0);
  const end = dayEnd(to).getTime();
  const busy = busyBetween(s, start, end);
  const tasks = s.tasks.filter((t) => t.status === 'pendiente' && t.dueDate && !t.scheduledEventId && t.dueDate >= dayKey(from) && t.dueDate <= dayKey(to));
  const offs = s.shifts.filter((x) => x.isDayOff && x.day >= dayKey(from) && x.day <= dayKey(to));
  const single = diffDays(from, to) === 0;
  const label = single ? fmtRelativeDay(from, today) : diffDays(from, to) <= 7 && dayKey(startOfWeek(from)) === dayKey(startOfWeek(today)) ? 'esta semana' : `del ${from.d} al ${to.d}`;
  if (!busy.length && !tasks.length) {
    const off = offs.length && single ? ' y libras' : '';
    return [`${upper(label)} lo tienes libre${off}.`, `${upper(label)} lo tienes libre${off}.`];
  }
  /** @type {string[]} */
  const lines = [];
  for (let d = from, i = 0; diffDays(d, to) >= 0 && i < 31; d = addDays(d, 1), i++) {
    const ds = dayStart(d).getTime();
    const de = dayEnd(d).getTime();
    const items = busy.filter((b) => b.start >= ds && b.start < de);
    const dt = tasks.filter((t) => t.dueDate === dayKey(d));
    const off = offs.some((x) => x.day === dayKey(d));
    if (!items.length && !dt.length && !off) continue;
    const parts = items.map((b) => `${fmtTime(b.start)} ${b.kind === 'shift' ? `turno hasta las ${fmtTime(b.end)}` : lower(b.title)}`);
    if (off) parts.push('libras');
    for (const t of dt) parts.push(`tarea: ${lower(t.title)}`);
    lines.push(`${upper(single ? label : `${WEEKDAYS[weekday(d)]} ${d.d}`)}: ${parts.join(', ')}`);
  }
  const events = busy.filter((b) => b.kind === 'event');
  const shifts = busy.filter((b) => b.kind === 'shift');
  const bits = [];
  if (events.length) bits.push(events.length === 1 ? 'una cosa' : `${events.length} cosas`);
  if (shifts.length) bits.push(shifts.length === 1 ? 'un turno' : `${shifts.length} turnos`);
  if (tasks.length) bits.push(tasks.length === 1 ? 'una tarea con fecha' : `${tasks.length} tareas con fecha`);
  const next = events[0];
  let speak = `${upper(label)} tienes ${bits.join(', ').replace(/, ([^,]*)$/, ' y $1') || 'poca cosa'}.`;
  if (next) speak += ` Lo primero, ${lower(next.title)} ${when(next.start, now)}.`;
  else if (shifts[0]) speak += ` Entras a trabajar ${when(shifts[0].start, now)}.`;
  return [lines.join('\n'), speak];
}

/**
 * Briefing al abrir la app por primera vez en el día.
 * @param {State} state
 * @param {Date} now
 * @returns {{ state: State, text: string, speak: string } | null}
 */
export function morningBriefing(state, now) {
  const today = civilOf(now);
  const key = dayKey(today);
  if (state.settings.lastBriefingDay === key) return null;
  const minutes = minutesOfDay(now);
  if (minutes < 5 * 60) return null;
  const s = structuredClone(state);
  s.settings.lastBriefingDay = key;
  const hello = minutes < 13 * 60 ? 'Buenos días' : minutes < 21 * 60 ? 'Buenas tardes' : 'Buenas noches';
  const [, speakToday] = describeRange(s, today, today, now);
  const bits = [`${hello}.`, speakToday];
  const due = s.tasks.filter((t) => t.status === 'pendiente' && t.dueDate === key).length;
  if (due) bits.push(due === 1 ? 'Hoy vence una tarea.' : `Hoy vencen ${due} tareas.`);
  const weekKey = dayKey(startOfWeek(today));
  if (s.settings.lastStaleWeek !== weekKey) {
    const stale = s.tasks.find((t) => t.status === 'pendiente' && !t.dueDate && now.getTime() - Date.parse(t.createdAt) > 7 * 86_400_000);
    if (stale) {
      bits.push(`Por cierto, ${lower(stale.title)} lleva más de una semana esperando.`);
      s.settings.lastStaleWeek = weekKey;
    }
  }
  const loads = dayLoads(s, addDays(today, 1), 6);
  const heavy = loads.reduce((a, b) => (b.hours > a.hours ? b : a), loads[0]);
  const light = loads.reduce((a, b) => (b.hours < a.hours ? b : a), loads[0]);
  if (heavy && light && heavy.items >= 2 && heavy.hours - light.hours >= 6) {
    bits.push(`${upper(fmtRelativeDay(heavy.day, today))} vas cargado y ${fmtRelativeDay(light.day, today)} lo tienes más suelto; si quieres, movemos algo.`);
  }
  const text = bits.join(' ');
  return { state: s, text, speak: text };
}

/**
 * Aviso de la víspera y resumen semanal, si toca. Respeta silencio y turnos.
 * @param {State} state
 * @param {Date} now
 * @returns {{ state: State, kind: 'nightly' | 'weekly', text: string } | null}
 */
export function scheduledDigest(state, now) {
  const t = now.getTime();
  if (inQuietHours(state, t) || shiftAt(state, t)) return null;
  const today = civilOf(now);
  const key = dayKey(today);
  const minutes = minutesOfDay(now);
  const s = structuredClone(state);
  if (weekday(today) === s.settings.weeklyDay && minutes >= hhmmToMin(s.settings.weeklyHour) && s.settings.lastWeeklyDay !== key) {
    s.settings.lastWeeklyDay = key;
    const nextMon = addDays(startOfWeek(today), 7);
    const [, speak] = describeRange(s, nextMon, addDays(nextMon, 6), now);
    return { state: s, kind: 'weekly', text: `Resumen de la semana que viene: ${lower(speak.replace(/^Del \d+ al \d+ /, ''))}` };
  }
  if (minutes >= hhmmToMin(s.settings.nightlyHour) && s.settings.lastNightlyDay !== key) {
    const tomorrow = addDays(today, 1);
    const from = dayStart(tomorrow).getTime();
    const to = dayEnd(tomorrow).getTime();
    const important = s.events.filter((e) => e.important && Date.parse(e.startsAt) >= from && Date.parse(e.startsAt) < to);
    const shift = s.shifts.find((x) => !x.isDayOff && x.day === dayKey(tomorrow));
    if (!important.length && !shift) return null;
    s.settings.lastNightlyDay = key;
    const bits = important.map((e) => `${lower(e.title)} a las ${fmtTime(e.startsAt)}`);
    if (shift) bits.push(`turno a las ${fmtTime(shift.startsAt)}`);
    return { state: s, kind: 'nightly', text: `Para mañana: ${bits.join(', ').replace(/, ([^,]*)$/, ' y $1')}.` };
  }
  return null;
}

/**
 * Recordatorios previos que tocan ahora. Idempotente: cada uno se marca una sola vez.
 * Suenan también en horas de silencio, porque son de un evento concreto.
 * @param {State} state
 * @param {Date} now
 * @returns {{ state: State, due: { key: string, text: string }[] }}
 */
export function dueReminders(state, now) {
  const t = now.getTime();
  const s = structuredClone(state);
  const due = [];
  for (const e of s.events) {
    if (e.reminderMin <= 0) continue;
    const start = Date.parse(e.startsAt);
    const key = `reminder:${e.id}:${e.startsAt}`;
    if (t >= start - e.reminderMin * MIN && t < start && !s.notified.includes(key)) {
      s.notified.push(key);
      const mins = Math.max(1, Math.round((start - t) / MIN));
      due.push({ key, text: `${upper(e.title)} a las ${fmtTime(start)} (en ${mins} min)${e.location ? `, ${e.location}` : ''}.` });
    }
  }
  s.notified = s.notified.slice(-500);
  return { state: s, due };
}

/**
 * Contexto compacto para la IA: fecha actual y próximos 7 días.
 * @param {State} state
 * @param {Date} now
 */
export function aiContext(state, now) {
  const today = civilOf(now);
  const [lines] = describeRange(state, today, addDays(today, 6), now);
  const prefs = state.memories.map((m) => `- ${m.content}`).join('\n');
  return [
    `Ahora: ${WEEKDAYS[weekday(today)]} ${dayKey(today)}, ${fmtTime(now)} (Europe/Madrid).`,
    `Próximos 7 días:\n${lines}`,
    prefs ? `Cosas que sabes de él:\n${prefs}` : '',
  ].filter(Boolean).join('\n\n');
}


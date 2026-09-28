// @ts-check
// Intérprete de frases en español para la agenda. Convierte lenguaje libre en
// intenciones estructuradas; las fechas se resuelven aquí, en código, nunca en la IA.

import { addDays, civilOf, diffDays, minutesOfDay, startOfWeek, weekday } from './time.js';

/** @typedef {import('./time.js').CivilDate} CivilDate */

/**
 * @typedef {{ start: number, end: number, date?: CivilDate, from?: CivilDate, to?: CivilDate }} DateHit
 * @typedef {{ start: number, end: number, startMin: number, endMin: number | null, guessed: boolean }} TimeHit
 * @typedef {{ kind: 'earliest' | 'latest', minutes: number }} PrefRule
 * @typedef {'alta' | 'media' | 'baja'} Priority
 * @typedef {{ type: 'confirm' } | { type: 'cancel' } | { type: 'greeting' } | { type: 'thanks' } | { type: 'help' }
 *   | { type: 'query', from: CivilDate, to: CivilDate }
 *   | { type: 'organize', date: CivilDate }
 *   | { type: 'move', from: CivilDate | null, to: CivilDate | null, toMin: number | null, hint: string }
 *   | { type: 'delete', date: CivilDate | null, hint: string }
 *   | { type: 'complete', hint: string }
 *   | { type: 'event', title: string, date: CivilDate, startMin: number, endMin: number, location: string, important: boolean, dateInferred: boolean, timeGuessed: boolean }
 *   | { type: 'task', title: string, due: CivilDate | null, from: CivilDate | null, priority: Priority, fit: boolean, durationMin: number }
 *   | { type: 'shift', days: CivilDate[], ranges: { startMin: number, endMin: number }[], dayOff: boolean }
 *   | { type: 'pref', rule: PrefRule }
 *   | { type: 'recurring', weekdays: number[], startMin: number, endMin: number, title: string }
 *   | { type: 'memory', content: string }
 *   | { type: 'clarify', question: string }
 *   | { type: 'unknown' }} Intent
 */

/**
 * Minúsculas y sin tildes, conservando la longitud exacta del texto original
 * para poder recortar títulos del texto tal y como lo escribiste.
 * @param {string} text
 */
export function normalize(text) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const lower = text[i].toLowerCase();
    const base = lower.length === 1 ? lower.normalize('NFD')[0] : ' ';
    if (/[a-z0-9]/.test(base)) out += base;
    else if (base === ':' || base === '/') out += base;
    else if (base === '.' && /\d/.test(text[i - 1] ?? '') && /\d/.test(text[i + 1] ?? '')) out += ':';
    else out += ' ';
  }
  return out;
}

/** Construye una RegExp donde cada espacio admite uno o más espacios. */
function re(/** @type {string} */ src, flags = 'g') {
  return new RegExp(src.replace(/ /g, '\\s+'), flags);
}

const NUM_WORDS = /** @type {Record<string, number>} */ ({
  un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8,
  nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16,
  diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, veintiuna: 21,
  veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25, treinta: 30,
  cuarenta: 40, cuarenta_y_cinco: 45, cincuenta: 50,
});
const NUMW = Object.keys(NUM_WORDS).map((k) => k.replace(/_/g, ' ')).sort((a, b) => b.length - a.length).join('|');

/** @param {string} s */
function num(s) {
  const k = s.trim().replace(/\s+/g, '_');
  return /^\d+$/.test(k) ? Number(k) : NUM_WORDS[k] ?? NaN;
}

const WD = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const WDR = WD.join('|');
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MONR = `${MONTHS.join('|')}|setiembre`;
/** @param {string} s */
const monthIndex = (s) => (s === 'setiembre' ? 9 : MONTHS.indexOf(s) + 1);

// ---------------------------------------------------------------- horas

const DAYPART = '(?: (?:de|por) la (?:manana|tarde|noche|madrugada))';
const CLOCK = `(?:\\d{1,2}(?::\\d{2}|h\\d{2}|h)?|${NUMW})(?: y media| y cuarto| menos cuarto| en punto| y (?:\\d{1,2}|${NUMW})| menos (?:\\d{1,2}|${NUMW}))?${DAYPART}?`;

/**
 * @param {string} tok
 * @returns {{ h: number, m: number, part: string | null, twentyFour: boolean }}
 */
function parseClock(tok) {
  const t = tok.replace(/\s+/g, ' ').trim();
  const partM = / (?:de|por) la (manana|tarde|noche|madrugada)$/.exec(t);
  const part = partM ? partM[1] : null;
  const core = partM ? t.slice(0, partM.index) : t;
  const hm = /^(\d{1,2})(?::(\d{2})|h(\d{2})|h)?/.exec(core);
  let h;
  let m = 0;
  let rest;
  if (hm) {
    h = Number(hm[1]);
    m = Number(hm[2] ?? hm[3] ?? 0);
    rest = core.slice(hm[0].length);
  } else {
    const w = new RegExp(`^(${NUMW})`).exec(core);
    h = w ? num(w[1]) : NaN;
    rest = w ? core.slice(w[0].length) : '';
  }
  const mod = rest.trim();
  if (mod === 'y media') m = 30;
  else if (mod === 'y cuarto') m = 15;
  else if (mod === 'menos cuarto') { h -= 1; m = 45; }
  else if (mod.startsWith('y ')) m = num(mod.slice(2));
  else if (mod.startsWith('menos ')) { h -= 1; m = 60 - num(mod.slice(6)); }
  const twentyFour = h > 12 || h === 0 || (hm !== null && hm[1].length === 2 && hm[1].startsWith('0'));
  return { h, m, part, twentyFour };
}

/**
 * Hora aislada. Sin "de la mañana/tarde" y entre 1 y 7 se entiende tarde
 * ("a las cinco" → 17:00): es lo habitual al hablar y la confirmación la dice.
 * @param {{ h: number, m: number, part: string | null, twentyFour: boolean }} c
 * @returns {{ min: number, guessed: boolean }}
 */
function resolveClock(c) {
  let h = c.h;
  let guessed = false;
  if (c.part === 'tarde' && h < 12) h += 12;
  else if (c.part === 'noche') { if (h >= 7 && h < 12) h += 12; else if (h === 12) h = 24; }
  else if (!c.part && !c.twentyFour && h >= 1 && h <= 7) { h += 12; guessed = true; }
  return { min: h * 60 + c.m, guessed };
}

/**
 * Franja "de A a B". Si alguna hora está en formato 24 h se respetan tal cual;
 * si no, se busca el primer final posterior al inicio (B, B+12 o B+24).
 * Un final igual o anterior al inicio cruza la medianoche.
 * @param {ReturnType<typeof parseClock>} a
 * @param {ReturnType<typeof parseClock>} b
 */
function resolveRange(a, b) {
  const valid = (/** @type {ReturnType<typeof parseClock>} */ c) => c.h >= 0 && c.h <= 24 && c.m >= 0 && c.m < 60;
  if (!valid(a) || !valid(b)) return null;
  if ((a.twentyFour || b.twentyFour) && !a.part && !b.part) {
    const s = a.h * 60 + a.m;
    let e = b.h * 60 + b.m;
    if (e <= s) e += 1440;
    return { startMin: s, endMin: e, guessed: false };
  }
  const s = a.part ? resolveClock(a) : resolveClock({ ...a, part: null });
  const endBase = b.part ? resolveClock(b).min : b.h * 60 + b.m;
  let e = endBase;
  for (const add of [0, 720, 1440, 2160]) {
    if (endBase + add > s.min) { e = endBase + add; break; }
  }
  return { startMin: s.min, endMin: e, guessed: s.guessed };
}

/**
 * @param {string} n texto normalizado
 * @returns {TimeHit[]}
 */
export function findTimes(n) {
  /** @type {TimeHit[]} */
  const hits = [];
  const taken = (/** @type {number} */ s, /** @type {number} */ e) => hits.some((h) => s < h.end && e > h.start);
  const ranges = [
    re(`\\b(?:de|desde)(?: las| la)? (${CLOCK}) (?:a|hasta)(?: las| la)? (${CLOCK})(?![\\w:])`),
    re(`\\bentre las? (${CLOCK}) y las? (${CLOCK})(?![\\w:])`),
  ];
  for (const r of ranges) {
    for (const m of n.matchAll(r)) {
      const idx = m.index ?? 0;
      const res = resolveRange(parseClock(m[1]), parseClock(m[2]));
      if (res && !taken(idx, idx + m[0].length)) hits.push({ start: idx, end: idx + m[0].length, ...res });
    }
  }
  const singles = [
    re(`\\b(?:a|sobre|hacia|para|antes de|despues de|desde|de) (?:las|la) (${CLOCK})(?![\\w:])`),
    re(`(?<![\\w:/])(\\d{1,2}:\\d{2}${DAYPART}?)(?![\\w:])`),
    re(`(?<![\\w:/])(\\d{1,2}h(?:\\d{2})?)(?![\\w:])`),
  ];
  for (const r of singles) {
    for (const m of n.matchAll(r)) {
      const idx = m.index ?? 0;
      if (taken(idx, idx + m[0].length)) continue;
      const c = parseClock(m[1]);
      if (!(c.h >= 0 && c.h <= 24 && c.m >= 0 && c.m < 60)) continue;
      const res = resolveClock(c);
      hits.push({ start: idx, end: idx + m[0].length, startMin: res.min, endMin: null, guessed: res.guessed });
    }
  }
  for (const m of n.matchAll(re('\\ba (mediodia|medianoche)\\b'))) {
    const idx = m.index ?? 0;
    if (!taken(idx, idx + m[0].length)) {
      hits.push({ start: idx, end: idx + m[0].length, startMin: m[1] === 'mediodia' ? 720 : 1440, endMin: null, guessed: false });
    }
  }
  return hits.sort((a, b) => a.start - b.start);
}

// ---------------------------------------------------------------- fechas

/**
 * @param {string} n texto normalizado
 * @param {CivilDate} today
 * @returns {DateHit[]}
 */
export function findDates(n, today) {
  const wdToday = weekday(today);
  /** @param {number} target @param {boolean} allowToday */
  const nextWd = (target, allowToday) => {
    let diff = (target - wdToday + 7) % 7;
    if (diff === 0 && !allowToday) diff = 7;
    return addDays(today, diff);
  };
  const nextMonday = addDays(startOfWeek(today), 7);
  const weekend = () => (wdToday >= 5 ? { from: today, to: addDays(startOfWeek(today), 6) } : { from: addDays(startOfWeek(today), 5), to: addDays(startOfWeek(today), 6) });
  /** @param {number} d @param {number} m @param {number | null} y */
  const dayMonth = (d, m, y) => {
    const year = y ?? today.y;
    const c = { y: year, m, d };
    const check = addDays(c, 0);
    if (check.m !== m || check.d !== d) return null;
    if (y === null && diffDays(today, c) < 0) return { y: year + 1, m, d };
    return c;
  };

  /** @type {[RegExp, (m: RegExpMatchArray) => Omit<DateHit, 'start' | 'end'> | null][]} */
  const rules = [
    [re('\\bpasado manana\\b'), () => ({ date: addDays(today, 2) })],
    [re(`\\b(?:el )?(${WDR}) (?:de )?(?:la )?(?:semana que viene|proxima semana)\\b`), (m) => ({ date: addDays(nextMonday, WD.indexOf(m[1])) })],
    [re('\\b(?:el|este) (?:finde|fin de semana) que viene\\b|\\bel proximo (?:finde|fin de semana)\\b'), () => (wdToday >= 5 ? { from: addDays(nextMonday, 5), to: addDays(nextMonday, 6) } : weekend())],
    [re('\\b(?:este|el) (?:finde|fin de semana)\\b|\\bfinde\\b'), () => weekend()],
    [re('\\b(?:la )?(?:semana que viene|proxima semana)\\b'), () => ({ from: nextMonday, to: addDays(nextMonday, 6) })],
    [re('\\besta semana\\b'), () => ({ from: today, to: addDays(startOfWeek(today), 6) })],
    [re('\\beste mes\\b'), () => {
      const last = addDays({ y: today.m === 12 ? today.y + 1 : today.y, m: today.m === 12 ? 1 : today.m + 1, d: 1 }, -1);
      return { from: today, to: last };
    }],
    [re(`\\beste (${WDR})\\b`), (m) => ({ date: nextWd(WD.indexOf(m[1]), true) })],
    [re(`\\b(?:el )?proximo (${WDR})\\b`), (m) => ({ date: nextWd(WD.indexOf(m[1]), false) })],
    [re(`\\b(?:el )?(${WDR})(?: que viene| proximo)?\\b`), (m) => ({ date: nextWd(WD.indexOf(m[1]), false) })],
    [re(`\\b(?:el )?(?:dia )?(\\d{1,2}) de (${MONR})(?: de (\\d{4}))?\\b`), (m) => {
      const c = dayMonth(Number(m[1]), monthIndex(m[2]), m[3] ? Number(m[3]) : null);
      return c ? { date: c } : null;
    }],
    [re('(?<![\\w:/])(\\d{1,2})/(\\d{1,2})(?:/(\\d{2,4}))?(?![\\w:/])'), (m) => {
      const y = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : null;
      const c = dayMonth(Number(m[1]), Number(m[2]), y);
      return c ? { date: c } : null;
    }],
    [re('\\bel (?:dia )?(\\d{1,2})\\b(?! de la)(?!:)'), (m) => {
      const d = Number(m[1]);
      let c = dayMonth(d, today.m, today.y);
      if (c && diffDays(today, c) < 0) c = null;
      if (!c) {
        const nm = today.m === 12 ? { y: today.y + 1, m: 1 } : { y: today.y, m: today.m + 1 };
        c = dayMonth(d, nm.m, nm.y);
      }
      return c ? { date: c } : null;
    }],
    [re('(?<!(?:de|por) la )\\bmanana\\b'), () => ({ date: addDays(today, 1) })],
    [re('\\b(?:hoy|esta noche|esta tarde|esta manana)\\b'), () => ({ date: today })],
  ];

  /** @type {DateHit[]} */
  const hits = [];
  for (const [r, resolve] of rules) {
    for (const m of n.matchAll(r)) {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      if (hits.some((h) => start < h.end && end > h.start)) continue;
      const res = resolve(m);
      if (res) hits.push({ start, end, ...res });
    }
  }
  return hits.sort((a, b) => a.start - b.start);
}

// ---------------------------------------------------------------- duración

/**
 * @param {string} n
 * @returns {{ start: number, end: number, minutes: number } | null}
 */
function findDuration(n) {
  const m = re(`\\b(?:durante |por )?(una hora y media|hora y media|media hora|una hora|un rato|(\\d+|${NUMW}) horas?(?: y media)?|(\\d+|${NUMW}) (?:minutos|min))\\b`, '').exec(n);
  if (!m) return null;
  const s = m[1];
  let minutes;
  if (s.includes('hora y media')) minutes = 90;
  else if (s === 'media hora') minutes = 30;
  else if (s === 'una hora' || s === 'un rato') minutes = 60;
  else if (m[2]) minutes = num(m[2]) * 60 + (s.endsWith('y media') ? 30 : 0);
  else minutes = num(m[3]);
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 1440) return null;
  return { start: m.index ?? 0, end: (m.index ?? 0) + m[0].length, minutes };
}

// ---------------------------------------------------------------- títulos

const LEAD = [
  'oye', 'hey', 'por favor', 'porfa', 'pues', 'vale', 'mira', 'bueno', 'recuerdame que', 'recuerdame',
  'recuerda', 'apuntame', 'apunta', 'anotame', 'anota', 'ponme', 'pon', 'agendame', 'agenda', 'anade',
  'crea', 'crear', 'mete', 'meteme', 'encajame', 'encajamelo', 'encajalo', 'buscame un hueco para', 'buscame hueco para',
  'tengo pendiente', 'tengo que', 'hay que', 'debo', 'necesito', 'tengo', 'tenemos', 'que', 'el', 'la', 'los', 'las',
  'y', 'a', 'de', 'para', 'una tarea', 'tarea', 'un evento', 'evento', 'una cita para',
];
const TRAIL = ['antes del', 'antes de', 'que', 'y', 'el', 'la', 'de', 'a', 'para', 'por favor', 'porfa', 'encajalo', 'encajamelo', 'tu', 'importante', 'urgente', 'sin prisa', 'cuando pueda', 'me', 'por'];

/**
 * Recorta del texto original las zonas usadas por fechas/horas y las muletillas.
 * @param {string} text original
 * @param {string} n normalizado (misma longitud)
 * @param {{ start: number, end: number }[]} spans
 * @param {string[]} extraLead
 */
function extractTitle(text, n, spans, extraLead = []) {
  let orig = '';
  let norm = '';
  for (let i = 0; i < text.length; i++) {
    const cut = spans.some((s) => i >= s.start && i < s.end);
    orig += cut ? ' ' : text[i];
    norm += cut ? ' ' : n[i];
  }
  const lead = [...extraLead, ...LEAD];
  let changed = true;
  while (changed) {
    changed = false;
    const lt = norm.length - norm.trimStart().length;
    orig = orig.slice(lt);
    norm = norm.slice(lt);
    for (const w of lead) {
      const m = re(`^${w}\\b`, '').exec(norm);
      if (m) {
        orig = orig.slice(m[0].length);
        norm = norm.slice(m[0].length);
        changed = true;
        break;
      }
    }
  }
  changed = true;
  while (changed) {
    changed = false;
    orig = orig.slice(0, norm.trimEnd().length);
    norm = norm.trimEnd();
    for (const w of TRAIL) {
      const m = re(`\\b${w}$`, '').exec(norm);
      if (m) {
        orig = orig.slice(0, m.index);
        norm = norm.slice(0, m.index);
        changed = true;
        break;
      }
    }
  }
  const clean = orig.replace(/[¿?¡!,;]+/g, ' ').replace(/\s+/g, ' ').trim();
  return clean ? clean[0].toUpperCase() + clean.slice(1) : '';
}

const PLACES = ['banco', 'medico', 'dentista', 'hospital', 'centro de salud', 'ayuntamiento', 'notaria', 'gestoria', 'hacienda', 'dni', 'comisaria', 'itv', 'taller', 'peluqueria', 'farmacia', 'correos', 'aeropuerto', 'puerto', 'oficina', 'consulta', 'clinica'];
const IMPORTANT = ['cita', 'entrevista', 'reunion', 'medico', 'ayuntamiento', 'importante', 'examen', 'juicio', 'notaria', 'hospital', 'dentista', 'vuelo'];

/** @param {string} titleNorm */
function locationOf(titleNorm, /** @type {string} */ title) {
  const m = / en (?:el |la |los |las )?(.+)$/.exec(titleNorm);
  if (m) return title.slice(title.length - m[1].length).trim();
  const hit = PLACES.map((p) => new RegExp(`\\b${p}\\b`).exec(titleNorm)).find(Boolean);
  if (!hit) return '';
  const word = title.slice(hit.index, hit.index + hit[0].length);
  return word[0].toUpperCase() + word.slice(1);
}

// ---------------------------------------------------------------- intenciones

const CONFIRM = /^(si|sip|vale|ok|okey|dale|venga|hazlo|confirmo|confirma|confirmado|adelante|perfecto|de acuerdo|claro|genial|guay|correcto|bien|me vale|eso es|eso)( (si|vale|hazlo|porfa|por favor|gracias|venga|dale|perfecto|adelante|claro))*$/;
const CANCEL = /^(no|nop|nope|cancela|cancelalo|dejalo|olvidalo|mejor no|no gracias|no no|no hace falta|dejalo estar|para|nada|ni de cona)$/;

/**
 * @param {string} text frase del usuario
 * @param {Date} now
 * @param {{ assistantName?: string }} [opts]
 * @returns {Intent}
 */
export function parse(text, now, opts = {}) {
  const n = normalize(text);
  const name = normalize(opts.assistantName ?? 'jarvis').trim();
  let t = n.replace(/\s+/g, ' ').trim();
  if (name && t.startsWith(`${name} `)) t = t.slice(name.length + 1);
  if (name && t.endsWith(` ${name}`)) t = t.slice(0, -name.length - 1);
  if (!t) return { type: 'unknown' };

  if (CONFIRM.test(t)) return { type: 'confirm' };
  if (CANCEL.test(t)) return { type: 'cancel' };
  if (/^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|que tal|que pasa|ey)( que tal)?$/.test(t) || t === name) return { type: 'greeting' };
  if (/^(muchas |mil )?gracias\b|^genial gracias|^te lo agradezco/.test(t)) return { type: 'thanks' };
  if (/\b(que puedes hacer|que sabes hacer|ayuda|como funcionas|como te uso)\b/.test(t)) return { type: 'help' };

  const today = civilOf(now);
  const nowMin = minutesOfDay(now);
  const dates = findDates(n, today);
  const times = findTimes(n);
  const single = dates.find((d) => d.date);
  const range = dates.find((d) => d.from && d.to);

  // Preferencias duraderas
  const pref = /\b(?:no me pongas|no quiero|nunca me pongas|no me metas|no me pongas nunca)(?: nada| cosas| citas| planes)? (antes|despues) de\b/.exec(t);
  if (pref && times.length) {
    const tm = times[0];
    let minutes = tm.startMin;
    if (pref[1] === 'antes' && tm.guessed) minutes -= 720;
    if (pref[1] === 'despues' && minutes < 720) minutes += 720;
    return { type: 'pref', rule: { kind: pref[1] === 'antes' ? 'earliest' : 'latest', minutes } };
  }

  // Bloques que se repiten cada semana
  const rec = re(`^(?:los|todos los|cada) ((?:${WDR})(?:(?: y|,)(?: los)? (?:${WDR}))*) (?:tengo|hay|voy a|voy|hago)\\b`, '').exec(t);
  if (rec) {
    const wds = [...rec[1].matchAll(new RegExp(WDR, 'g'))].map((m) => WD.indexOf(m[0]));
    const tm = times.find((x) => x.endMin !== null);
    if (!tm || tm.endMin === null) return { type: 'clarify', question: '¿De qué hora a qué hora?' };
    const recIdx = n.indexOf(rec[0].split(' ').pop() ?? '');
    const title = extractTitle(text, n, [{ start: 0, end: Math.max(recIdx, 0) + (rec[0].split(' ').pop() ?? '').length }, tm]) || 'Bloque fijo';
    return { type: 'recurring', weekdays: [...new Set(wds)], startMin: tm.startMin, endMin: tm.endMin, title };
  }

  // Consultas
  if (/\b(que tengo|que hay|tengo algo|como tengo|como voy|que me toca|agenda de|mi agenda|estoy libre|cuando trabajo|cuando curro|que turnos|como es mi|como tengo la)\b/.test(t) && !/\b(apunta|pon|anota)\b/.test(t)) {
    if (range?.from && range.to) return { type: 'query', from: range.from, to: range.to };
    const d = single?.date ?? today;
    return { type: 'query', from: d, to: d };
  }

  // Turnos de trabajo
  const dayOff = /\b(libro|libre|libranza|no trabajo|no curro|descanso|tengo fiesta)\b/.test(t);
  if (/\b(trabajo|curro|turno|entro a trabajar|me toca trabajar|entro)\b/.test(t) || dayOff) {
    const days = dates.flatMap((d) => (d.date ? [d.date] : []));
    if (days.length && (dayOff || times.length)) {
      if (dayOff && !/\b(trabajo|curro|turno)\b/.test(t.replace(/no (trabajo|curro)/, ''))) {
        return { type: 'shift', days, ranges: [], dayOff: true };
      }
      const ranges = times.filter((x) => x.endMin !== null).map((x) => ({ startMin: x.startMin, endMin: /** @type {number} */ (x.endMin) }));
      if (!ranges.length) return { type: 'clarify', question: '¿A qué hora entras y a qué hora sales?' };
      return { type: 'shift', days, ranges, dayOff: false };
    }
  }

  if (/\b(organiza(me)?|planifica(me)?|ordena(me)?|cuadrame|montame|organizame)\b/.test(t)) {
    return { type: 'organize', date: single?.date ?? range?.from ?? today };
  }

  const dayparts = [...n.matchAll(re('\\b(?:por|de) la (manana|tarde|noche|madrugada)\\b|\\ba mediodia\\b'))]
    .filter((m) => !times.some((x) => (m.index ?? 0) >= x.start && (m.index ?? 0) < x.end))
    .map((m) => ({ start: m.index ?? 0, end: (m.index ?? 0) + m[0].length, part: m[1] ?? 'mediodia' }));
  const spans = [...dates, ...times, ...dayparts];
  /** @param {RegExp} verb */
  const hintAfter = (verb) => {
    const title = extractTitle(text, n, spans, []);
    return normalize(title).replace(verb, ' ').replace(/\b(lo|la|el|los|las|del|de|al|a|para|me|que|mi|esto|eso|todo|una|un|cita|evento|tarea|como hecha|como hecho|hecha|hecho|ya)\b/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const moveVerb = /\b(pasa(me|lo|mela|melo)?|mueve(me|lo)?|muevelo|cambia(me|lo)?|cambialo|traslada(lo)?|retrasa(lo)?|adelanta(lo)?)\b/;
  if (moveVerb.test(t)) {
    let from = null;
    let to = null;
    const ds = dates.filter((d) => d.date);
    if (ds.length >= 2) { from = ds[0].date ?? null; to = ds[1].date ?? null; }
    else if (ds.length === 1) {
      const before = n.slice(0, ds[0].start).replace(/\s+/g, ' ').trimEnd();
      if (/\b(al|a|para el|para)$/.test(before)) to = ds[0].date ?? null;
      else from = ds[0].date ?? null;
    }
    const tm = times.length ? times[times.length - 1].startMin : null;
    return { type: 'move', from, to, toMin: tm, hint: hintAfter(moveVerb) };
  }

  const delVerb = /\b(borra(me|lo)?|elimina(me|lo)?|quita(me|lo)?|cancela(me|lo)?|anula(lo)?|suprime)\b/;
  if (delVerb.test(t)) return { type: 'delete', date: single?.date ?? null, hint: hintAfter(delVerb) };

  const doneVerb = /\b(ya he hecho|he hecho|ya he|he terminado|termine|ya esta hecho|completa(da)?|marca|tacha|hecho)\b/;
  if (doneVerb.test(t) && !times.length) return { type: 'complete', hint: hintAfter(doneVerb) };

  const mem = /^(recuerda que|acuerdate de que|apunta que|ten en cuenta que|que sepas que|para que lo sepas|quiero que sepas que)\b/.exec(t);
  if (mem) {
    const content = text.trim().slice(text.trim().length - t.length + mem[0].length).trim();
    return { type: 'memory', content: content ? content[0].toUpperCase() + content.slice(1) : '' };
  }

  const dur = findDuration(n);
  const allSpans = dur ? [...spans, dur] : spans;
  const title = extractTitle(text, n, allSpans, name ? [name] : []);
  const titleNorm = normalize(title);
  const location = locationOf(titleNorm, title);
  const important = Boolean(location) || IMPORTANT.some((w) => new RegExp(`\\b${w}\\b`).test(t));

  if (times.length && title) {
    const tm = times[0];
    const part = dayparts.find(Boolean)?.part;
    if (tm.guessed && part === 'manana' && tm.startMin >= 720) tm.startMin -= 720;
    let date = single?.date ?? range?.from ?? null;
    let dateInferred = false;
    if (!date) {
      date = tm.startMin > nowMin ? today : addDays(today, 1);
      dateInferred = true;
    }
    const endMin = tm.endMin ?? tm.startMin + (dur?.minutes ?? 60);
    return { type: 'event', title, date, startMin: tm.startMin, endMin, location, important, dateInferred, timeGuessed: tm.guessed };
  }

  const taskish = /\b(tengo que|hay que|debo|necesito|tengo pendiente|recuerdame|apunta(me)?|anota(me)?|pon(me)?|agenda(me)?|anade|encaja(me|lo|melo)?|buscame (un )?hueco)\b/.test(t);
  if ((taskish || dates.length) && title) {
    const deadlineOnly = single !== undefined && /\bantes del?\s*$/.test(n.slice(0, single.start));
    const priority = /\b(urgente|importante|prioridad alta|cuanto antes|ya mismo)\b/.test(t) ? 'alta' : /\b(sin prisa|cuando pueda|cuando puedas|prioridad baja)\b/.test(t) ? 'baja' : 'media';
    return {
      type: 'task',
      title,
      due: single?.date ?? range?.to ?? null,
      from: deadlineOnly ? null : single?.date ?? range?.from ?? null,
      priority,
      fit: Boolean(single || range) || /\bencaja|hueco\b/.test(t),
      durationMin: dur?.minutes ?? 60,
    };
  }
  return { type: 'unknown' };
}

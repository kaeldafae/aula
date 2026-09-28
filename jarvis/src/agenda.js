// @ts-check
// Lógica de agenda en código: ocupación, conflictos y huecos libres.

import { addDays, civilOf, dayEnd, dayKey, dayStart, diffDays, fromZoned, hhmmToMin, MIN, minutesOfDay, weekday } from './time.js';

/** @typedef {import('./time.js').CivilDate} CivilDate */
/** @typedef {import('./store.js').State} State */
/** @typedef {{ start: number, end: number, kind: 'event' | 'shift' | 'block', id: string, title: string, travel: boolean }} Busy */
/** @typedef {{ start: number, end: number }} Slot */

const PRIORITY_ORDER = { alta: 0, media: 1, baja: 2 };

/**
 * Todo lo que ocupa tiempo entre dos instantes: eventos, turnos y bloques fijos semanales.
 * @param {State} state
 * @param {number} from ms
 * @param {number} to ms
 * @returns {Busy[]}
 */
export function busyBetween(state, from, to) {
  /** @type {Busy[]} */
  const out = [];
  for (const e of state.events) {
    const s = Date.parse(e.startsAt);
    const en = Date.parse(e.endsAt);
    if (s < to && en > from) out.push({ start: s, end: en, kind: 'event', id: e.id, title: e.title, travel: Boolean(e.location) });
  }
  for (const sh of state.shifts) {
    if (sh.isDayOff) continue;
    const s = Date.parse(sh.startsAt);
    const en = Date.parse(sh.endsAt);
    if (s < to && en > from) out.push({ start: s, end: en, kind: 'shift', id: sh.id, title: 'Turno', travel: true });
  }
  const blocks = state.memories.flatMap((m) => (m.rule?.kind === 'recurring' ? [{ id: m.id, rule: m.rule }] : []));
  if (blocks.length) {
    // Un día antes para cubrir bloques que cruzan la medianoche.
    for (let d = addDays(civilOf(from), -1); dayStart(d).getTime() < to; d = addDays(d, 1)) {
      const wd = weekday(d);
      for (const { id, rule } of blocks) {
        if (rule.kind !== 'recurring' || !rule.weekdays.includes(wd)) continue;
        const s = fromZoned(d, rule.startMin).getTime();
        const en = fromZoned(d, rule.endMin).getTime();
        if (s < to && en > from) out.push({ start: s, end: en, kind: 'block', id: `${id}:${dayKey(d)}`, title: rule.title, travel: true });
      }
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

/**
 * Lo que choca con la franja [start, end). Los bordes que se tocan no chocan.
 * @param {State} state
 * @param {number} start
 * @param {number} end
 * @param {string} [ignoreId] evento que se está moviendo
 */
export function conflicts(state, start, end, ignoreId) {
  return busyBetween(state, start, end).filter((b) => b.id !== ignoreId && b.start < end && b.end > start);
}

/**
 * Ventana útil de un día: desde que te levantas hasta que te acuestas, recortada
 * por tus preferencias ("nada antes de las 9").
 * @param {State} state
 * @param {CivilDate} day
 */
export function dayWindow(state, day) {
  const s = state.settings;
  let startMin = hhmmToMin(s.sleepEnd);
  let endMin = hhmmToMin(s.sleepStart);
  if (endMin <= startMin) endMin += 1440;
  for (const m of state.memories) {
    if (m.rule?.kind === 'earliest') startMin = Math.max(startMin, m.rule.minutes);
    if (m.rule?.kind === 'latest') endMin = Math.min(endMin, m.rule.minutes);
  }
  return { start: fromZoned(day, startMin).getTime(), end: fromZoned(day, endMin).getTime() };
}

/** @param {number} ms redondea hacia arriba al cuarto de hora */
function ceilQuarter(ms) {
  const q = 15 * MIN;
  return Math.ceil(ms / q) * q;
}

/**
 * Huecos libres de `durationMin` minutos entre dos días (incluidos), respetando
 * turnos, sueño, preferencias y el margen de desplazamiento. Un hueco por tramo libre.
 * @param {State} state
 * @param {CivilDate} fromDay
 * @param {CivilDate} toDay
 * @param {number} durationMin
 * @param {Date} now
 * @param {number} [limit]
 * @returns {Slot[]}
 */
export function freeSlots(state, fromDay, toDay, durationMin, now, limit = 3) {
  const travel = state.settings.travelMin * MIN;
  const dur = durationMin * MIN;
  const earliest = now.getTime() + 30 * MIN;
  /** @type {Slot[]} */
  const slots = [];
  const days = Math.min(diffDays(fromDay, toDay), 62);
  for (let i = 0; i <= days && slots.length < limit; i++) {
    const day = addDays(fromDay, i);
    const win = dayWindow(state, day);
    const winStart = Math.max(win.start, earliest);
    if (winStart >= win.end) continue;
    const busy = busyBetween(state, win.start - travel, win.end + travel)
      .map((b) => (b.travel ? { start: b.start - travel, end: b.end + travel } : b));
    let cursor = winStart;
    for (const b of [...busy, { start: win.end, end: win.end }]) {
      const candidate = ceilQuarter(cursor);
      if (b.start > candidate && candidate + dur <= Math.min(b.start, win.end)) {
        slots.push({ start: candidate, end: candidate + dur });
        if (slots.length >= limit) break;
      }
      cursor = Math.max(cursor, b.end);
      if (cursor >= win.end) break;
    }
  }
  return slots;
}

/**
 * Hueco del día más cercano a la hora que se pidió (para proponer alternativa
 * cuando esa hora choca con algo).
 * @param {State} state
 * @param {CivilDate} day
 * @param {number} durationMin
 * @param {Date} now
 * @param {number} target instante deseado
 * @param {string} [ignoreId] evento que se está moviendo
 * @returns {Slot | null}
 */
export function nearestSlot(state, day, durationMin, now, target, ignoreId) {
  const travel = state.settings.travelMin * MIN;
  const dur = durationMin * MIN;
  const q = 15 * MIN;
  const win = dayWindow(state, day);
  const winStart = Math.max(win.start, now.getTime() + 30 * MIN);
  if (winStart >= win.end) return null;
  const busy = busyBetween(state, win.start - travel, win.end + travel)
    .filter((b) => b.id !== ignoreId)
    .map((b) => (b.travel ? { start: b.start - travel, end: b.end + travel } : b));
  /** @type {Slot | null} */
  let best = null;
  let cursor = winStart;
  for (const b of [...busy, { start: win.end, end: win.end }]) {
    const lo = ceilQuarter(cursor);
    const hi = Math.floor((Math.min(b.start, win.end) - dur) / q) * q;
    if (hi >= lo) {
      const start = Math.min(hi, ceilQuarter(Math.max(lo, target)));
      if (!best || Math.abs(start - target) < Math.abs(best.start - target)) best = { start, end: start + dur };
    }
    cursor = Math.max(cursor, b.end);
    if (cursor >= win.end) break;
  }
  return best;
}

/**
 * Propuesta para "organízame el viernes": reparte las tareas pendientes sin hora
 * en los huecos del día, por prioridad y fecha límite.
 * @param {State} state
 * @param {CivilDate} day
 * @param {Date} now
 * @returns {{ taskId: string, title: string, start: number, end: number }[]}
 */
export function planDay(state, day, now) {
  const pending = state.tasks
    .filter((t) => t.status === 'pendiente' && !t.scheduledEventId)
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));
  /** @type {{ taskId: string, title: string, start: number, end: number }[]} */
  const plan = [];
  /** @type {State} */
  const scratch = { ...state, events: [...state.events] };
  for (const task of pending) {
    const [slot] = freeSlots(scratch, day, day, task.durationMin, now, 1);
    if (!slot) continue;
    plan.push({ taskId: task.id, title: task.title, start: slot.start, end: slot.end });
    scratch.events.push({
      id: `plan:${task.id}`, title: task.title, startsAt: new Date(slot.start).toISOString(), endsAt: new Date(slot.end).toISOString(),
      location: '', areaId: task.areaId, important: false, reminderMin: 0, source: 'texto', createdAt: '', updatedAt: '',
    });
    if (plan.length >= 6) break;
  }
  return plan;
}

/**
 * Carga de cada día (horas ocupadas) para sugerir reequilibrios.
 * @param {State} state
 * @param {CivilDate} fromDay
 * @param {number} days
 */
export function dayLoads(state, fromDay, days) {
  /** @type {{ day: CivilDate, hours: number, items: number }[]} */
  const out = [];
  for (let i = 0; i < days; i++) {
    const day = addDays(fromDay, i);
    const s = dayStart(day).getTime();
    const e = dayEnd(day).getTime();
    const busy = busyBetween(state, s, e);
    const hours = busy.reduce((acc, b) => acc + (Math.min(b.end, e) - Math.max(b.start, s)), 0) / 3_600_000;
    out.push({ day, hours, items: busy.filter((b) => b.kind === 'event').length });
  }
  return out;
}

/**
 * Turno activo en un instante, si lo hay.
 * @param {State} state
 * @param {number} at
 */
export function shiftAt(state, at) {
  return state.shifts.find((s) => !s.isDayOff && Date.parse(s.startsAt) <= at && Date.parse(s.endsAt) > at) ?? null;
}

/**
 * ¿Está `at` dentro de las horas de silencio?
 * @param {State} state
 * @param {number} at
 */
export function inQuietHours(state, at) {
  const minutes = minutesOfDay(at);
  const qs = hhmmToMin(state.settings.quietStart);
  const qe = hhmmToMin(state.settings.quietEnd);
  return qs <= qe ? minutes >= qs && minutes < qe : minutes >= qs || minutes < qe;
}

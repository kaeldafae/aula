// @ts-check
// Fechas y horas siempre en Europe/Madrid, con independencia de la zona del
// dispositivo o del servidor de CI. Las horas se guardan como instantes ISO (UTC)
// y los días "de calendario" como {y, m, d}, sin zona.

export const TZ = 'Europe/Madrid';
export const MIN = 60_000;
export const DAY_MIN = 1440;

/** @typedef {{ y: number, m: number, d: number }} CivilDate  m: 1-12 */
/** @typedef {CivilDate & { h: number, min: number, wd: number }} ZonedParts  wd: 0 = lunes … 6 = domingo */

const partsFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/**
 * Descompone un instante en la hora de pared de Madrid.
 * @param {Date | number} date
 * @returns {ZonedParts}
 */
export function zoned(date) {
  /** @type {Record<string, number>} */
  const p = {};
  for (const part of partsFmt.formatToParts(new Date(date))) {
    if (part.type !== 'literal') p[part.type] = Number(part.value);
  }
  const civil = { y: p.year, m: p.month, d: p.day };
  return { ...civil, h: p.hour, min: p.minute, wd: weekday(civil) };
}

/**
 * Desfase de Madrid respecto a UTC en minutos (60 en invierno, 120 en verano).
 * @param {Date | number} date
 */
export function offsetMinutes(date) {
  const t = new Date(date).getTime();
  const z = zoned(t);
  const s = new Date(t).getUTCSeconds();
  const asUtc = Date.UTC(z.y, z.m - 1, z.d, z.h, z.min, s);
  return Math.round((asUtc - (t - new Date(t).getUTCMilliseconds())) / MIN);
}

/**
 * Instante correspondiente a una hora de pared en Madrid.
 * `minutes` puede pasar de 1440 (p. ej. 1500 = 01:00 del día siguiente).
 * En el hueco del cambio de hora de marzo, la hora inexistente se desplaza hacia
 * delante; en la hora repetida de octubre se elige la segunda aparición.
 * @param {CivilDate} c
 * @param {number} minutes
 * @returns {Date}
 */
export function fromZoned(c, minutes) {
  const wall = Date.UTC(c.y, c.m - 1, c.d, 0, minutes);
  const first = wall - offsetMinutes(wall) * MIN;
  return new Date(wall - offsetMinutes(first) * MIN);
}

/** @param {CivilDate} c 0 = lunes … 6 = domingo */
export function weekday(c) {
  return (new Date(Date.UTC(c.y, c.m - 1, c.d)).getUTCDay() + 6) % 7;
}

/** @param {CivilDate} c @param {number} n */
export function addDays(c, n) {
  const t = new Date(Date.UTC(c.y, c.m - 1, c.d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** @param {CivilDate} a @param {CivilDate} b  días de a hasta b */
export function diffDays(a, b) {
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}

/** @param {CivilDate} c */
export function dayKey(c) {
  return `${c.y}-${String(c.m).padStart(2, '0')}-${String(c.d).padStart(2, '0')}`;
}

/** @param {string} key 'YYYY-MM-DD' @returns {CivilDate | null} */
export function parseDayKey(key) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const c = { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
  return dayKey(addDays(c, 0)) === key ? c : null;
}

/** @param {Date | number} date */
export function civilOf(date) {
  const z = zoned(date);
  return { y: z.y, m: z.m, d: z.d };
}

/** @param {CivilDate} c  lunes de la semana de c */
export function startOfWeek(c) {
  return addDays(c, -weekday(c));
}

/** @param {CivilDate} c  inicio del día en Madrid */
export function dayStart(c) {
  return fromZoned(c, 0);
}

/** @param {CivilDate} c  fin del día (inicio del siguiente) */
export function dayEnd(c) {
  return fromZoned(addDays(c, 1), 0);
}

/** @param {string} hhmm 'HH:MM' → minutos desde medianoche */
export function hhmmToMin(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return NaN;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h <= 24 && min < 60 ? h * 60 + min : NaN;
}

/** @param {number} minutes */
export function minToHhmm(minutes) {
  const m = ((minutes % DAY_MIN) + DAY_MIN) % DAY_MIN;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** @param {Date | number} date  minutos desde la medianoche de Madrid */
export function minutesOfDay(date) {
  const z = zoned(date);
  return z.h * 60 + z.min;
}

/** @param {Date | number | string} date */
export function fmtTime(date) {
  const z = zoned(new Date(date));
  return `${String(z.h).padStart(2, '0')}:${String(z.min).padStart(2, '0')}`;
}

export const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
export const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/**
 * "hoy", "mañana", "el jueves" o "el jueves 8 de octubre", según la distancia a hoy.
 * @param {CivilDate} c
 * @param {CivilDate} today
 */
export function fmtRelativeDay(c, today) {
  const diff = diffDays(today, c);
  if (diff === 0) return 'hoy';
  if (diff === 1) return 'mañana';
  if (diff === 2) return 'pasado mañana';
  if (diff === -1) return 'ayer';
  const wd = WEEKDAYS[weekday(c)];
  if (diff > 2 && diff < 7) return `el ${wd}`;
  return `el ${wd} ${c.d} de ${MONTHS[c.m - 1]}`;
}

/** @param {CivilDate} c */
export function fmtLongDay(c) {
  return `${WEEKDAYS[weekday(c)]} ${c.d} de ${MONTHS[c.m - 1]}`;
}

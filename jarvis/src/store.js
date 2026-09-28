// @ts-check
// Estado de la app: un único documento JSON guardado en el iPhone.
// Todo lo que entra (copias de seguridad, respuestas de la IA, formularios)
// pasa por estos saneadores antes de guardarse.

import { hhmmToMin } from './time.js';

/**
 * @typedef {{ id: string, name: string, color: string, isDefault: boolean }} Area
 * @typedef {{ id: string, title: string, startsAt: string, endsAt: string, location: string, areaId: string,
 *   important: boolean, reminderMin: number, source: 'voz' | 'texto' | 'manual', createdAt: string, updatedAt: string }} CalEvent
 * @typedef {{ id: string, title: string, dueDate: string | null, priority: 'alta' | 'media' | 'baja',
 *   status: 'pendiente' | 'hecha', areaId: string, scheduledEventId: string | null, durationMin: number,
 *   createdAt: string, completedAt: string | null }} Task
 * @typedef {{ id: string, day: string, startsAt: string, endsAt: string, isDayOff: boolean }} Shift
 * @typedef {{ kind: 'earliest' | 'latest', minutes: number }
 *   | { kind: 'recurring', weekdays: number[], startMin: number, endMin: number, title: string }} MemoryRule
 * @typedef {{ id: string, content: string, category: 'preferencia' | 'bloque' | 'dato', rule: MemoryRule | null, createdAt: string }} Memory
 * @typedef {{ id: string, role: 'user' | 'assistant', text: string, at: string }} Message
 * @typedef {{ id: string, kind: 'create_event' | 'update_event' | 'delete_event' | 'schedule_task' | 'plan' | 'delete_task',
 *   payload: any, summary: string, expiresAt: string }} Pending
 * @typedef {{ assistantName: string, voiceURI: string, speak: boolean, quietStart: string, quietEnd: string,
 *   nightlyHour: string, weeklyDay: number, weeklyHour: string, defaultReminderMin: number,
 *   sleepStart: string, sleepEnd: string, travelMin: number, aiEnabled: boolean, aiModel: 'normal' | 'ligero',
 *   lastBriefingDay: string, lastNightlyDay: string, lastWeeklyDay: string, lastStaleWeek: string, onboarded: boolean }} Settings
 * @typedef {{ version: 1, settings: Settings, areas: Area[], events: CalEvent[], tasks: Task[], shifts: Shift[],
 *   memories: Memory[], messages: Message[], pending: Pending | null, notified: string[] }} State
 */

export const STORAGE_KEY = 'jarvis.v1';
export const MAX_MESSAGES = 200;
const MAX_TEXT = 500;

/** @returns {Settings} */
export function defaultSettings() {
  return {
    assistantName: 'Jarvis',
    voiceURI: '',
    speak: true,
    quietStart: '23:30',
    quietEnd: '08:00',
    nightlyHour: '21:00',
    weeklyDay: 6,
    weeklyHour: '18:00',
    defaultReminderMin: 30,
    sleepStart: '23:30',
    sleepEnd: '08:00',
    travelMin: 20,
    aiEnabled: false,
    aiModel: 'normal',
    lastBriefingDay: '',
    lastNightlyDay: '',
    lastWeeklyDay: '',
    lastStaleWeek: '',
    onboarded: false,
  };
}

/** @returns {Area[]} */
export function defaultAreas() {
  return [
    { id: 'personal', name: 'Personal', color: '#4f7cff', isDefault: true },
    { id: 'trabajo', name: 'Trabajo', color: '#8a8f98', isDefault: true },
    { id: 'kael', name: 'KAEL', color: '#0fa3b1', isDefault: true },
    { id: 'hilo', name: 'HILO', color: '#e07a5f', isDefault: true },
    { id: 'estudios', name: 'Estudios', color: '#9b5de5', isDefault: true },
  ];
}

/** @returns {State} */
export function createState() {
  return {
    version: 1,
    settings: defaultSettings(),
    areas: defaultAreas(),
    events: [],
    tasks: [],
    shifts: [],
    memories: [],
    messages: [],
    pending: null,
    notified: [],
  };
}

export function uid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------- saneadores

/** @param {unknown} v @param {number} [max] */
const str = (v, max = MAX_TEXT) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
/** @param {unknown} v */
const isIso = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v)) && /T.*Z$/.test(v);
/** @param {unknown} v */
const isDayKey = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
/** @param {unknown} v */
const isHhmm = (v) => typeof v === 'string' && Number.isFinite(hhmmToMin(v)) && hhmmToMin(v) < 1440;
/** @param {unknown} v @param {number} lo @param {number} hi @param {number} def */
const int = (v, lo, hi, def) => (typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi ? v : def);
/** @param {unknown} v */
const obj = (v) => (v && typeof v === 'object' ? /** @type {Record<string, unknown>} */ (v) : null);

/**
 * @param {unknown} raw
 * @param {Set<string>} areaIds
 * @returns {CalEvent | null}
 */
export function sanitizeEvent(raw, areaIds) {
  const o = obj(raw);
  if (!o) return null;
  const title = str(o.title, 120);
  if (!title || !isIso(o.startsAt) || !isIso(o.endsAt)) return null;
  const startsAt = /** @type {string} */ (o.startsAt);
  const endsAt = /** @type {string} */ (o.endsAt);
  const dur = Date.parse(endsAt) - Date.parse(startsAt);
  if (dur <= 0 || dur > 7 * 86_400_000) return null;
  const now = new Date().toISOString();
  return {
    id: str(o.id, 64) || uid(),
    title,
    startsAt,
    endsAt,
    location: str(o.location, 120),
    areaId: areaIds.has(str(o.areaId)) ? str(o.areaId) : 'personal',
    important: o.important === true,
    reminderMin: int(o.reminderMin, 0, 10_080, 30),
    source: o.source === 'voz' || o.source === 'manual' ? o.source : 'texto',
    createdAt: isIso(o.createdAt) ? /** @type {string} */ (o.createdAt) : now,
    updatedAt: isIso(o.updatedAt) ? /** @type {string} */ (o.updatedAt) : now,
  };
}

/**
 * @param {unknown} raw
 * @param {Set<string>} areaIds
 * @returns {Task | null}
 */
export function sanitizeTask(raw, areaIds) {
  const o = obj(raw);
  if (!o) return null;
  const title = str(o.title, 120);
  if (!title) return null;
  return {
    id: str(o.id, 64) || uid(),
    title,
    dueDate: isDayKey(o.dueDate) ? /** @type {string} */ (o.dueDate) : null,
    priority: o.priority === 'alta' || o.priority === 'baja' ? o.priority : 'media',
    status: o.status === 'hecha' ? 'hecha' : 'pendiente',
    areaId: areaIds.has(str(o.areaId)) ? str(o.areaId) : 'personal',
    scheduledEventId: str(o.scheduledEventId, 64) || null,
    durationMin: int(o.durationMin, 5, 1440, 60),
    createdAt: isIso(o.createdAt) ? /** @type {string} */ (o.createdAt) : new Date().toISOString(),
    completedAt: isIso(o.completedAt) ? /** @type {string} */ (o.completedAt) : null,
  };
}

/** @param {unknown} raw @returns {Shift | null} */
export function sanitizeShift(raw) {
  const o = obj(raw);
  if (!o || !isDayKey(o.day) || !isIso(o.startsAt) || !isIso(o.endsAt)) return null;
  const dur = Date.parse(/** @type {string} */ (o.endsAt)) - Date.parse(/** @type {string} */ (o.startsAt));
  if (dur < 0 || dur > 86_400_000) return null;
  return {
    id: str(o.id, 64) || uid(),
    day: /** @type {string} */ (o.day),
    startsAt: /** @type {string} */ (o.startsAt),
    endsAt: /** @type {string} */ (o.endsAt),
    isDayOff: o.isDayOff === true,
  };
}

/** @param {unknown} raw @returns {MemoryRule | null} */
function sanitizeRule(raw) {
  const o = obj(raw);
  if (!o) return null;
  if (o.kind === 'earliest' || o.kind === 'latest') {
    const minutes = int(o.minutes, 0, 1440, -1);
    return minutes < 0 ? null : { kind: o.kind, minutes };
  }
  if (o.kind === 'recurring' && Array.isArray(o.weekdays)) {
    const weekdays = [...new Set(o.weekdays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))];
    const startMin = int(o.startMin, 0, 1440, -1);
    const endMin = int(o.endMin, 1, 2880, -1);
    if (!weekdays.length || startMin < 0 || endMin <= startMin) return null;
    return { kind: 'recurring', weekdays, startMin, endMin, title: str(o.title, 80) || 'Bloque fijo' };
  }
  return null;
}

/** @param {unknown} raw @returns {Memory | null} */
export function sanitizeMemory(raw) {
  const o = obj(raw);
  if (!o) return null;
  const content = str(o.content, 300);
  if (!content) return null;
  const rule = sanitizeRule(o.rule);
  const category = o.category === 'preferencia' || o.category === 'bloque' ? o.category : 'dato';
  return { id: str(o.id, 64) || uid(), content, category: rule ? category : 'dato', rule, createdAt: isIso(o.createdAt) ? /** @type {string} */ (o.createdAt) : new Date().toISOString() };
}

/** @param {unknown} raw @returns {Settings} */
function sanitizeSettings(raw) {
  const d = defaultSettings();
  const o = obj(raw) ?? {};
  /** @param {keyof Settings} k */
  const hh = (k) => (isHhmm(o[k]) ? /** @type {string} */ (o[k]) : /** @type {string} */ (d[k]));
  /** @param {keyof Settings} k */
  const day = (k) => (isDayKey(o[k]) || typeof o[k] === 'string' && /^\d{4}-W\d{2}$/.test(/** @type {string} */ (o[k])) ? /** @type {string} */ (o[k]) : '');
  return {
    assistantName: str(o.assistantName, 30) || d.assistantName,
    voiceURI: str(o.voiceURI, 200),
    speak: o.speak !== false,
    quietStart: hh('quietStart'),
    quietEnd: hh('quietEnd'),
    nightlyHour: hh('nightlyHour'),
    weeklyDay: int(o.weeklyDay, 0, 6, d.weeklyDay),
    weeklyHour: hh('weeklyHour'),
    defaultReminderMin: int(o.defaultReminderMin, 0, 1440, d.defaultReminderMin),
    sleepStart: hh('sleepStart'),
    sleepEnd: hh('sleepEnd'),
    travelMin: int(o.travelMin, 0, 180, d.travelMin),
    aiEnabled: o.aiEnabled === true,
    aiModel: o.aiModel === 'ligero' ? 'ligero' : 'normal',
    lastBriefingDay: day('lastBriefingDay'),
    lastNightlyDay: day('lastNightlyDay'),
    lastWeeklyDay: day('lastWeeklyDay'),
    lastStaleWeek: day('lastStaleWeek'),
    onboarded: o.onboarded === true,
  };
}

/**
 * Reconstruye un estado válido a partir de cualquier JSON (guardado o importado).
 * Lo que no pasa la validación se descarta en vez de romper la app.
 * @param {unknown} raw
 * @returns {State}
 */
export function sanitizeState(raw) {
  const o = obj(raw);
  if (!o || o.version !== 1) return createState();
  /** @type {Area[]} */
  const areas = [];
  for (const a of Array.isArray(o.areas) ? o.areas : defaultAreas()) {
    const ao = obj(a);
    const name = ao ? str(ao.name, 30) : '';
    const id = ao ? str(ao.id, 64) : '';
    if (!ao || !name || !id || areas.some((x) => x.id === id)) continue;
    const color = typeof ao.color === 'string' && /^#[0-9a-f]{6}$/i.test(ao.color) ? ao.color : '#4f7cff';
    areas.push({ id, name, color, isDefault: ao.isDefault === true });
  }
  if (!areas.some((a) => a.id === 'personal')) areas.unshift(defaultAreas()[0]);
  const ids = new Set(areas.map((a) => a.id));
  /** @template T @param {unknown} list @param {(x: unknown) => T | null} fn @returns {T[]} */
  const all = (list, fn) => (Array.isArray(list) ? list.map(fn).filter(/** @returns {x is T} */ (x) => x !== null) : []);
  const messages = all(o.messages, (m) => {
    const mo = obj(m);
    if (!mo || (mo.role !== 'user' && mo.role !== 'assistant') || !str(mo.text, 2000)) return null;
    /** @type {Message['role']} */
    const role = mo.role;
    return { id: str(mo.id, 64) || uid(), role, text: str(mo.text, 2000), at: isIso(mo.at) ? /** @type {string} */ (mo.at) : new Date().toISOString() };
  }).slice(-MAX_MESSAGES);
  const p = obj(o.pending);
  const kinds = ['create_event', 'update_event', 'delete_event', 'schedule_task', 'plan', 'delete_task'];
  const pending = p && kinds.includes(/** @type {string} */ (p.kind)) && isIso(p.expiresAt) && typeof p.summary === 'string'
    ? /** @type {Pending} */ ({ id: str(p.id, 64) || uid(), kind: p.kind, payload: p.payload ?? null, summary: str(p.summary), expiresAt: p.expiresAt })
    : null;
  return {
    version: 1,
    settings: sanitizeSettings(o.settings),
    areas,
    events: all(o.events, (e) => sanitizeEvent(e, ids)),
    tasks: all(o.tasks, (t) => sanitizeTask(t, ids)),
    shifts: all(o.shifts, sanitizeShift),
    memories: all(o.memories, sanitizeMemory),
    messages,
    pending,
    notified: Array.isArray(o.notified) ? o.notified.filter((k) => typeof k === 'string').slice(-500) : [],
  };
}

/**
 * @param {Pick<Storage, 'getItem'>} storage
 * @returns {State}
 */
export function loadState(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? sanitizeState(JSON.parse(raw)) : createState();
  } catch {
    return createState();
  }
}

/**
 * @param {Pick<Storage, 'setItem'>} storage
 * @param {State} state
 * @returns {boolean} false si no se pudo guardar (modo privado, almacenamiento lleno)
 */
export function saveState(storage, state) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

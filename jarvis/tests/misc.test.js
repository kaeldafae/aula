import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { validateReply } from '../src/ai.js';
import { buildIcs } from '../src/ics.js';
import { createState, loadState, sanitizeState, saveState, STORAGE_KEY } from '../src/store.js';

const root = new URL('../', import.meta.url);

test('sanitizeState descarta datos inválidos sin romper', () => {
  const s = sanitizeState({
    version: 1,
    events: [
      { title: 'Bien', startsAt: '2026-10-01T15:00:00.000Z', endsAt: '2026-10-01T16:00:00.000Z', areaId: 'kael' },
      { title: 'Al revés', startsAt: '2026-10-01T16:00:00.000Z', endsAt: '2026-10-01T15:00:00.000Z' },
      { title: '', startsAt: '2026-10-01T15:00:00.000Z', endsAt: '2026-10-01T16:00:00.000Z' },
      '<script>',
    ],
    tasks: [{ title: 'x', priority: 'rarísima', areaId: 'no-existe' }],
    settings: { quietStart: '25:00', travelMin: -5, assistantName: '  Viernes ' },
    pending: { kind: 'borrar_todo', expiresAt: '2026-10-01T15:00:00.000Z', summary: 'x' },
  });
  assert.equal(s.events.length, 1);
  assert.equal(s.events[0].areaId, 'kael');
  assert.equal(s.tasks[0].priority, 'media');
  assert.equal(s.tasks[0].areaId, 'personal');
  assert.equal(s.settings.quietStart, '23:30');
  assert.equal(s.settings.travelMin, 20);
  assert.equal(s.settings.assistantName, 'Viernes');
  assert.equal(s.pending, null);
  assert.deepEqual(sanitizeState('basura'), createState());
});

test('guardar y cargar conserva el estado; un JSON corrupto no rompe', () => {
  /** @type {Record<string, string>} */
  const mem = {};
  const storage = { getItem: (/** @type {string} */ k) => mem[k] ?? null, setItem: (/** @type {string} */ k, /** @type {string} */ v) => { mem[k] = v; } };
  const s = createState();
  s.settings.assistantName = 'Friday';
  assert.equal(saveState(storage, s), true);
  assert.equal(loadState(storage).settings.assistantName, 'Friday');
  mem[STORAGE_KEY] = '{roto';
  assert.deepEqual(loadState(storage), createState());
  const full = { setItem: () => { throw new Error('QuotaExceededError'); } };
  assert.equal(saveState(full, s), false);
});

test('ics válido con aviso y líneas plegadas', () => {
  const ics = buildIcs([{ uid: 'a1', title: 'Cita, médico; revisión', start: Date.parse('2026-10-01T15:00:00Z'), end: Date.parse('2026-10-01T16:00:00Z'), location: 'Centro de salud', reminderMin: 30 }], Date.parse('2026-09-28T08:00:00Z'));
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART:20261001T150000Z\r\n/);
  assert.match(ics, /SUMMARY:Cita\\, médico\\; revisión\r\n/);
  assert.match(ics, /TRIGGER:-PT30M\r\n/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
  const long = buildIcs([{ uid: 'b', title: 'ñ'.repeat(80), start: 0, end: 3_600_000 }], 0);
  for (const line of long.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75, line);
});

test('la IA no puede colar respuestas inválidas ni "soy una IA"', () => {
  assert.deepEqual(validateReply({ tipo: 'orden', orden: 'qué tengo mañana', respuesta: '' }), { tipo: 'orden', orden: 'qué tengo mañana', respuesta: '' });
  assert.equal(validateReply({ tipo: 'borrar', orden: 'x', respuesta: 'y' }), null);
  assert.equal(validateReply({ tipo: 'charla', orden: '', respuesta: 'Como IA no tengo opiniones.' }), null);
  assert.equal(validateReply({ tipo: 'charla', orden: '', respuesta: '¡Claro! Hace buen día.' })?.respuesta, 'Hace buen día.');
  assert.equal(validateReply(null), null);
});

test('el service worker precarga todos los ficheros de la app', () => {
  const sw = readFileSync(new URL('sw.js', root), 'utf8');
  const listed = [...sw.matchAll(/^\s+'([^']+)',$/gm)].map((m) => m[1]);
  for (const f of readdirSync(new URL('src/', root))) assert.ok(listed.includes(`src/${f}`), `falta src/${f} en sw.js`);
  for (const f of readdirSync(new URL('icons/', root))) assert.ok(listed.includes(`icons/${f}`), `falta icons/${f} en sw.js`);
  for (const f of listed) if (f !== './') assert.ok(existsSync(new URL(f, root)), `sw.js cita ${f}, que no existe`);
  const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
  assert.match(sw, new RegExp(`const VERSION = 'jarvis-v${pkg.version.replace(/\./g, '\\.')}'`), 'VERSION de sw.js debe coincidir con package.json');
});

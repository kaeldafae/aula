import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dueReminders, morningBriefing, respond, scheduledDigest } from '../src/assistant.js';
import { conflicts, freeSlots, inQuietHours } from '../src/agenda.js';
import { createState } from '../src/store.js';
import { fmtTime } from '../src/time.js';

const NOW = new Date('2026-09-28T08:00:00Z'); // lunes 10:00 Madrid
const later = (/** @type {number} */ min) => new Date(NOW.getTime() + min * 60_000);

/** Encadena frases sobre el mismo estado. */
function talk(/** @type {string[]} */ lines, state = createState(), now = NOW) {
  let s = state;
  /** @type {ReturnType<typeof respond>[]} */
  const out = [];
  for (const l of lines) {
    const r = respond(s, l, now);
    s = r.state;
    out.push(r);
  }
  return { state: s, out };
}

test('crear evento sin conflicto no pide confirmación', () => {
  const { state, out } = talk(['el jueves a las cinco tengo que ir al banco']);
  assert.equal(state.events.length, 1);
  assert.equal(state.pending, null);
  assert.match(out[0].reply, /ir al banco, el jueves a las 17:00/);
  assert.equal(state.events[0].startsAt, '2026-10-01T15:00:00.000Z');
});

test('un conflicto con un turno se detecta siempre y no se crea nada', () => {
  const { state, out } = talk(['trabajo el jueves de 16 a 24', 'el jueves a las cinco tengo que ir al banco']);
  assert.equal(state.events.length, 0);
  assert.ok(state.pending);
  assert.match(out[1].reply, /estás de turno/);
  // La alternativa no puede caer dentro del turno ni del margen de desplazamiento.
  const alt = state.pending.payload;
  assert.equal(conflicts(state, Date.parse(alt.startsAt), Date.parse(alt.endsAt)).length, 0);
  assert.ok(Date.parse(alt.endsAt) <= Date.parse('2026-10-01T14:00:00Z') - 20 * 60_000);
  // Y es el hueco más cercano a las 17:00: justo antes del turno, no a primera hora.
  assert.equal(fmtTime(alt.startsAt), '14:30');
});

test('conflicto con otro evento y con un turno que cruza medianoche', () => {
  const a = talk(['mañana a las 10 dentista', 'mañana a las 10:30 café con Ana']);
  assert.equal(a.state.events.length, 1);
  assert.match(a.out[1].reply, /ya tienes dentista/);
  const b = talk(['trabajo el sábado de 20 a 2', 'el domingo a la 1 de la madrugada cena de equipo']);
  assert.equal(b.state.events.length, 0);
  assert.match(b.out[1].reply, /turno/);
});

test('mover requiere confirmación y "sí" lo ejecuta', () => {
  const { state, out } = talk(['el martes a las 18 peluquería', 'pásame lo del martes al miércoles']);
  assert.equal(state.events[0].startsAt, '2026-09-29T16:00:00.000Z');
  assert.ok(state.pending);
  assert.match(out[1].reply, /¿Paso peluquería a pasado mañana a las 18:00\?/);
  const done = respond(state, 'sí', later(1));
  assert.equal(done.state.events[0].startsAt, '2026-09-30T16:00:00.000Z');
  assert.equal(done.state.pending, null);
});

test('borrar requiere confirmación y "no" lo cancela', () => {
  const { state } = talk(['el jueves a las cinco tengo que ir al banco', 'borra lo del banco']);
  assert.equal(state.events.length, 1);
  assert.equal(state.pending?.kind, 'delete_event');
  const r = respond(state, 'no', later(1));
  assert.equal(r.state.events.length, 1);
  assert.equal(r.state.pending, null);
  const r2 = respond(state, 'sí', later(1));
  assert.equal(r2.state.events.length, 0);
});

test('las acciones pendientes caducan a los 10 minutos', () => {
  const { state } = talk(['el jueves a las cinco tengo que ir al banco', 'borra lo del banco']);
  const r = respond(state, 'sí', later(11));
  assert.equal(r.state.events.length, 1);
  assert.match(r.reply, /caducó/);
});

test('"encájalo tú": propone hueco respetando turnos, sueño y preferencias', () => {
  const base = talk([
    'no me pongas nada antes de las 9',
    'trabajo el martes de 10 a 18',
    'trabajo el miércoles de 10 a 18',
  ]).state;
  const { state, out } = talk(['tengo que renovar el DNI esta semana'], base);
  assert.equal(state.tasks.length, 1);
  assert.equal(state.pending?.kind, 'schedule_task');
  const { start, end } = state.pending.payload;
  assert.equal(conflicts(state, start, end).length, 0);
  assert.ok(Number(fmtTime(start).slice(0, 2)) >= 9);
  assert.match(out[0].reply, /¿Te encajo ahí renovar el DNI\?/);
  const r = respond(state, 'sí', later(1));
  assert.equal(r.state.events.length, 1);
  assert.equal(r.state.tasks[0].scheduledEventId, r.state.events[0].id);
});

test('organízame el viernes propone y solo guarda tras confirmar', () => {
  const { state, out } = talk(['tengo que llamar al gestor', 'tengo que preparar la presentación de KAEL', 'organízame el viernes']);
  assert.equal(state.pending?.kind, 'plan');
  assert.equal(state.events.length, 0);
  assert.match(out[2].reply, /te propongo/);
  const r = respond(state, 'vale', later(1));
  assert.equal(r.state.events.length, 2);
  assert.equal(r.state.events.find((e) => e.title.includes('KAEL'))?.areaId, 'kael');
});

test('bloques semanales cuentan como ocupados', () => {
  const { state, out } = talk(['los lunes tengo clase de 18 a 20', 'el lunes a las 19 cena']);
  assert.equal(state.events.length, 0);
  assert.match(out[1].reply, /clase/);
});

test('huecos: nunca dentro del sueño', () => {
  const s = createState();
  const slots = freeSlots(s, { y: 2026, m: 9, d: 29 }, { y: 2026, m: 9, d: 29 }, 60, NOW, 5);
  for (const sl of slots) {
    const h = Number(fmtTime(sl.start).slice(0, 2));
    assert.ok(h >= 8 && h < 23, fmtTime(sl.start));
  }
});

test('recordatorios idempotentes y válidos en horas de silencio', () => {
  const { state } = talk(['mañana a las 10 dentista']);
  const at = new Date('2026-09-29T07:40:00Z'); // 09:40, 20 min antes
  const first = dueReminders(state, at);
  assert.equal(first.due.length, 1);
  const second = dueReminders(first.state, new Date(at.getTime() + 60_000));
  assert.equal(second.due.length, 0);
});

test('horas de silencio y turnos bloquean los resúmenes', () => {
  const s = createState();
  assert.equal(inQuietHours(s, Date.parse('2026-09-28T22:00:00Z')), true); // 00:00
  assert.equal(inQuietHours(s, Date.parse('2026-09-28T10:00:00Z')), false);
  const withShift = talk(['trabajo hoy de 20 a 24', 'mañana a las 10 médico']).state;
  const during = scheduledDigest(withShift, new Date('2026-09-28T19:30:00Z')); // 21:30, de turno
  assert.equal(during, null);
  const free = talk(['mañana a las 10 médico']).state;
  const ok = scheduledDigest(free, new Date('2026-09-28T19:30:00Z'));
  assert.equal(ok?.kind, 'nightly');
  assert.match(ok?.text ?? '', /médico a las 10:00/);
  assert.equal(scheduledDigest(/** @type {any} */ (ok).state, new Date('2026-09-28T19:40:00Z')), null);
});

test('briefing una sola vez al día', () => {
  const { state } = talk(['hoy a las 18 dentista']);
  const b = morningBriefing(state, NOW);
  assert.ok(b);
  assert.match(b.text, /Buenos días/);
  assert.equal(morningBriefing(b.state, later(60)), null);
});

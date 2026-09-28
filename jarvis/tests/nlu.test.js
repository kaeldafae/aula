import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, parse } from '../src/nlu.js';

// Lunes 28 de septiembre de 2026, 10:00 en Madrid.
const NOW = new Date('2026-09-28T08:00:00Z');
/** @param {string} s */
const p = (s, now = NOW) => /** @type {any} */ (parse(s, now));
const d = (/** @type {number} */ m, /** @type {number} */ day) => ({ y: 2026, m, d: day });

test('normalize conserva la longitud', () => {
  const s = '¿Qué tengo el miércoles? Ñu 17.30';
  assert.equal(normalize(s).length, s.length);
  assert.match(normalize(s), /que tengo el miercoles/);
  assert.match(normalize(s), /17:30/);
});

test('ejemplo 1: el jueves a las cinco tengo que ir al banco', () => {
  const r = p('el jueves a las cinco tengo que ir al banco');
  assert.equal(r.type, 'event');
  assert.equal(r.title, 'Ir al banco');
  assert.deepEqual(r.date, d(10, 1));
  assert.equal(r.startMin, 17 * 60);
  assert.equal(r.endMin, 18 * 60);
  assert.equal(r.important, true);
});

test('ejemplo 2: pásame lo del martes al miércoles', () => {
  const r = p('pásame lo del martes al miércoles');
  assert.equal(r.type, 'move');
  assert.deepEqual(r.from, d(9, 29));
  assert.deepEqual(r.to, d(9, 30));
  assert.equal(r.toMin, null);
});

test('ejemplo 3: ¿qué tengo esta semana?', () => {
  const r = p('¿qué tengo esta semana?');
  assert.equal(r.type, 'query');
  assert.deepEqual(r.from, d(9, 28));
  assert.deepEqual(r.to, d(10, 4));
});

test('ejemplo 4: organízame el viernes', () => {
  const r = p('organízame el viernes');
  assert.deepEqual(r, { type: 'organize', date: d(10, 2) });
});

test('fechas relativas', () => {
  assert.deepEqual(p('el jueves que viene a las 10 dentista').date, d(10, 1));
  assert.deepEqual(p('el jueves de la semana que viene a las 10 dentista').date, d(10, 8));
  assert.deepEqual(p('pasado mañana a las 10 dentista').date, d(9, 30));
  assert.deepEqual(p('mañana a las 10 dentista').date, d(9, 29));
  assert.deepEqual(p('el lunes a las 10 dentista').date, d(10, 5));
  assert.deepEqual(p('este lunes a las 18 dentista').date, d(9, 28));
  assert.deepEqual(p('el 15 de octubre a las 12:30 ITV').date, d(10, 15));
  assert.deepEqual(p('el 3/10 a las 12 ITV').date, d(10, 3));
});

test('este finde', () => {
  const q = p('¿qué tengo este finde?');
  assert.deepEqual([q.from, q.to], [d(10, 3), d(10, 4)]);
  // Un sábado, "este finde" empieza hoy.
  const sat = new Date('2026-10-03T08:00:00Z');
  const q2 = p('¿qué tengo este finde?', sat);
  assert.deepEqual([q2.from, q2.to], [d(10, 3), d(10, 4)]);
});

test('fechas alrededor del cambio de hora', () => {
  const sat = new Date('2026-10-24T20:00:00Z'); // sábado 22:00
  const r = p('mañana a las 10 desayuno con Ana', sat);
  assert.deepEqual(r.date, d(10, 25));
  assert.equal(r.startMin, 600);
});

test('horas en lenguaje natural', () => {
  assert.equal(p('mañana a las nueve y media reunión').startMin, 9 * 60 + 30);
  assert.equal(p('mañana a las cinco menos cuarto reunión').startMin, 16 * 60 + 45);
  assert.equal(p('mañana a las 9 de la noche cena').startMin, 21 * 60);
  assert.equal(p('mañana por la mañana a las 7 gimnasio').startMin, 7 * 60);
  assert.equal(p('mañana a mediodía comida con Luis').startMin, 12 * 60);
  const r = p('mañana de 5 a 7 taller');
  assert.deepEqual([r.startMin, r.endMin], [17 * 60, 19 * 60]);
});

test('hora sin día: hoy si aún no ha pasado, si no mañana', () => {
  const r = p('a las 18 llamar a mamá');
  assert.deepEqual(r.date, d(9, 28));
  const r2 = p('a las 9 llamar a mamá');
  assert.deepEqual(r2.date, d(9, 29));
  assert.equal(r2.dateInferred, true);
});

test('tareas y "encájalo tú"', () => {
  const r = p('tengo que renovar el DNI esta semana');
  assert.equal(r.type, 'task');
  assert.equal(r.title, 'Renovar el DNI');
  assert.deepEqual(r.due, d(10, 4));
  assert.equal(r.fit, true);
  const r2 = p('tengo que llamar al gestor, es urgente');
  assert.equal(r2.priority, 'alta');
  assert.equal(r2.fit, false);
});

test('turnos: normal, partido, cruzando medianoche y libranza', () => {
  assert.deepEqual(p('trabajo el martes de 16 a 24').ranges, [{ startMin: 960, endMin: 1440 }]);
  assert.deepEqual(p('el martes trabajo de 10 a 14 y de 19 a 23').ranges, [{ startMin: 600, endMin: 840 }, { startMin: 1140, endMin: 1380 }]);
  assert.deepEqual(p('trabajo el sábado de 20 a 2').ranges, [{ startMin: 1200, endMin: 1560 }]);
  assert.deepEqual(p('trabajo el sábado de 7 a 15').ranges, [{ startMin: 420, endMin: 900 }]);
  const off = p('libro el miércoles');
  assert.equal(off.dayOff, true);
  assert.deepEqual(off.days, [d(9, 30)]);
});

test('memoria y preferencias', () => {
  assert.deepEqual(p('no me pongas nada antes de las 9'), { type: 'pref', rule: { kind: 'earliest', minutes: 540 } });
  assert.deepEqual(p('no me pongas nada después de las 10'), { type: 'pref', rule: { kind: 'latest', minutes: 1320 } });
  const rec = p('los lunes tengo clase de 18 a 20');
  assert.deepEqual([rec.type, rec.weekdays, rec.startMin, rec.endMin, rec.title], ['recurring', [0], 1080, 1200, 'Clase']);
  const rec2 = p('los martes y jueves tengo inglés de 17 a 18');
  assert.deepEqual(rec2.weekdays, [1, 3]);
  assert.equal(p('recuerda que mi hermana se llama Laura').content, 'Mi hermana se llama Laura');
});

test('confirmar, cancelar, borrar, completar', () => {
  assert.equal(p('sí').type, 'confirm');
  assert.equal(p('vale, hazlo').type, 'confirm');
  assert.equal(p('no').type, 'cancel');
  assert.equal(p('no me pongas nada antes de las 8').type, 'pref');
  assert.deepEqual(p('borra lo del banco'), { type: 'delete', date: null, hint: 'banco' });
  assert.equal(p('ya he hecho renovar el DNI').hint, 'renovar dni');
  assert.equal(p('Jarvis, sí').type, 'confirm');
});

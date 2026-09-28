import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, civilOf, dayEnd, dayStart, fmtTime, fromZoned, offsetMinutes, weekday, zoned } from '../src/time.js';

test('desfase de Madrid: verano 120, invierno 60', () => {
  assert.equal(offsetMinutes(new Date('2026-07-01T12:00:00Z')), 120);
  assert.equal(offsetMinutes(new Date('2026-12-01T12:00:00Z')), 60);
});

test('cambio de hora de octubre 2026 (25 oct, 03:00 → 02:00)', () => {
  const day = { y: 2026, m: 10, d: 25 };
  assert.equal(fromZoned(day, 60).toISOString(), '2026-10-24T23:00:00.000Z');
  assert.equal(fromZoned(day, 180).toISOString(), '2026-10-25T02:00:00.000Z');
  // Ese día dura 25 horas.
  assert.equal((dayEnd(day).getTime() - dayStart(day).getTime()) / 3_600_000, 25);
  // Un evento a las 10:00 del domingo sigue siendo a las 10:00 de pared.
  assert.equal(fmtTime(fromZoned(day, 600)), '10:00');
});

test('cambio de hora de marzo 2026 (29 mar, 02:00 → 03:00)', () => {
  const day = { y: 2026, m: 3, d: 29 };
  assert.equal((dayEnd(day).getTime() - dayStart(day).getTime()) / 3_600_000, 23);
  // Las 02:30 no existen: se desplazan a las 03:30.
  assert.equal(fmtTime(fromZoned(day, 150)), '03:30');
  assert.equal(fmtTime(fromZoned(day, 600)), '10:00');
});

test('minutos por encima de 1440 caen en el día siguiente', () => {
  const d = fromZoned({ y: 2026, m: 10, d: 3 }, 1560);
  assert.deepEqual(civilOf(d), { y: 2026, m: 10, d: 4 });
  assert.equal(fmtTime(d), '02:00');
});

test('zoned no depende de la zona del proceso', () => {
  const z = zoned(new Date('2026-09-28T22:30:00Z'));
  assert.deepEqual([z.y, z.m, z.d, z.h, z.min, z.wd], [2026, 9, 29, 0, 30, 1]);
});

test('weekday y addDays', () => {
  assert.equal(weekday({ y: 2026, m: 9, d: 28 }), 0);
  assert.deepEqual(addDays({ y: 2026, m: 12, d: 31 }, 1), { y: 2027, m: 1, d: 1 });
  assert.deepEqual(addDays({ y: 2028, m: 3, d: 1 }, -1), { y: 2028, m: 2, d: 29 });
});

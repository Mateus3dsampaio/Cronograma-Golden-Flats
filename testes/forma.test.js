import test from 'node:test';
import assert from 'node:assert/strict';
import { FORMA, APTOS_POR_PAV, unidades, torre, alturaTotal } from '../src/publico/js/ui/predio3d/forma.js';

/** Área de um contorno (pontos [x, y]), em metros quadrados. */
const area = c => Math.abs(c.reduce((s, [x, y], i) => { const [x2, y2] = c[(i + 1) % c.length]; return s + x * y2 - x2 * y; }, 0) / 2) / FORMA.escala ** 2;
const meio = c => c.reduce(([sx, sy], [x, y]) => [sx + x / c.length, sy + y / c.length], [0, 0]);

test('pavimento tipo tem 14 apartamentos e o hall', () => {
  const u = unidades();
  assert.equal(u.aptos.length, APTOS_POR_PAV);
  assert.ok(u.hall.length > 4);
});

test('apartamentos nas posições da planta: 07 na ponta sudeste, 14 na noroeste, 01 ao norte do 08', () => {
  const m = unidades().aptos.map(meio);
  assert.ok(m[6][0] > 0 && m[6][1] < 0, 'apto 07 a sudeste');
  assert.ok(m[13][0] < 0 && m[13][1] > 0, 'apto 14 a noroeste');
  assert.ok(m[0][1] > 0 && m[7][1] < 0, 'apto 01 ao norte, 08 ao sul');
});

test('as duas alas são espelhadas pelo meio da torre', () => {
  const u = unidades().aptos;
  for (let n = 1; n <= 7; n++) { const a = meio(u[n - 1]), b = meio(u[n + 6]); assert.ok(Math.abs(a[0] + b[0]) < 1e-9 && Math.abs(a[1] + b[1]) < 1e-9); }
});

test('área dos apartamentos fica perto da planta (37 a 49 m², com paredes e descontada a fresta do desenho)', () => {
  for (const c of unidades().aptos) { const a = area(c); assert.ok(a > 30 && a < 56, `área ${a.toFixed(1)} m²`); }
});

test('torre inteira e altura total', () => {
  assert.equal(torre().length, 3);
  assert.ok(Math.abs(alturaTotal(17) / FORMA.escala - (6 + 17 * 3.06 + 3.7 + 2.6)) < 1e-9);
});

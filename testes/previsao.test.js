import test from 'node:test';
import assert from 'node:assert/strict';
import { estadoPadrao } from '../src/compartilhado/estado-padrao.js';
import { calcular, contexto, equipesPara, preverComN } from '../src/compartilhado/previsao.js';
import { linhasCliente, resumoCliente } from '../src/compartilhado/cliente.js';
import { estadoExemplo } from '../src/compartilhado/exemplo.js';

const HOJE = { d: '2026-11-14', t: 1 }; // sábado; a obra padrão começa na segunda 16/11
const nova = () => estadoPadrao(HOJE.d);

test('obra padrão: 232 aptos + 17 halls + recepção, começa na segunda', () => {
  const S = nova(), R = calcular(S, HOJE);
  assert.equal(S.cfg.inicio, '2026-11-16');
  assert.equal(R.aptosTot, 232); assert.equal(R.hallsTot, 17); assert.equal(R.tot, 250); assert.equal(R.recepFeita, false);
});

test('4 equipes a 2 dias por apto, 1 por hall e 5 pela recepção terminam em 07/05/2027', () => {
  // 232 x 2 + 17 x 1 = 481 dias de equipe / 4 equipes = 120,25 dias úteis a partir de 16/11/2026 (03/05/2027);
  // a recepção fica no fim da fila: uma equipe só, mais 5 dias úteis
  assert.equal(calcular(nova(), HOJE).fim.d, '2027-05-07');
  const S = nova(); S.feitos.R = { d: '2026-11-16', t: 0, e: 'e1' };
  assert.ok(calcular(S, HOJE).fim.d < '2027-05-07', 'recepção concluída sai da fila');
});

test('mais equipes terminam antes; sem equipe não há previsão', () => {
  const S = nova(), antes = calcular(S, HOJE).fim.d;
  S.equipes.push({ id: 'e9', nome: 'Extra', tipo: 'terceirizada', cor: 5, ativa: true, entrada: '', pausas: [] });
  assert.ok(calcular(S, HOJE).fim.d < antes);
  S.equipes.forEach(e => e.ativa = false);
  assert.equal(calcular(S, HOJE).fim, null);
});

test('feriado empurra o término', () => {
  const S = nova(), antes = calcular(S, HOJE).fim.d;
  S.cfg.feriados.push('2026-12-25');
  assert.ok(calcular(S, HOJE).fim.d > antes);
});

test('equipe rápida puxa a previsão para antes; a lenta empurra', () => {
  const ag = { d: '2026-11-20', t: 1 }; // sexta da 1ª semana
  const plano = calcular(nova(), ag).fim.d;
  const rapida = nova(); // equipe 1 fez 4 aptos em 5 dias (planejado: 2,5)
  ['1-1', '1-2', '1-3', '1-4'].forEach((id, i) => rapida.feitos[id] = { d: ['2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20'][i], t: 1, e: 'e1' });
  assert.ok(calcular(rapida, ag).fim.d < plano);
  assert.ok(calcular(rapida, ag).c.st.e1.bruto < 4);
});

test('simulador: quantidade mínima de equipes bate com a previsão', () => {
  const S = nova(), c = contexto(S, HOJE);
  const n = equipesPara(c, S, '2027-03-24', '2026-11-16', 'real');
  assert.ok(n > 4);
  assert.ok(c.cal.em(preverComN(c, S, n, '2026-11-16', 'real').fimT).d <= '2027-03-24');
  assert.ok(c.cal.em(preverComN(c, S, n - 1, '2026-11-16', 'real').fimT).d > '2027-03-24');
  assert.equal(equipesPara(c, S, '2026-11-17', '2026-11-16', 'real'), null); // impossível
});

test('pavimento só é liberado com todos os aptos e o hall', () => {
  const S = nova();
  for (let k = 1; k <= 14; k++) S.feitos['1-' + k] = { d: '2026-11-20', t: 0, e: 'e1' };
  const ag = { d: '2026-11-20', t: 1 };
  assert.equal(calcular(S, ag).liberados, 0);
  S.feitos['1-H'] = { d: '2026-11-20', t: 1, e: 'e2' };
  const R = calcular(S, ag);
  assert.equal(R.liberados, 1);
  assert.equal(linhasCliente(S, R)[0].est, 'Liberado');
});

test('margem de segurança adia as datas do cliente, e o resumo não expõe equipes', () => {
  const S = nova(), sem = linhasCliente(S, calcular(S, HOJE))[5].s.d;
  S.cfg.margemCliente = 3;
  const R = calcular(S, HOJE), res = resumoCliente(S, R);
  assert.ok(res.linhas[5].s.d > sem);
  assert.ok(!JSON.stringify(res).includes('Equipe'));
});

test('dados de exemplo: obra em andamento e coerente', () => {
  const R = calcular(estadoExemplo(HOJE), HOJE);
  assert.ok(R.feitas > 30 && R.feitas < R.tot);
  assert.ok(R.fim.d > HOJE.d);
});

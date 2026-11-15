import test from 'node:test';
import assert from 'node:assert/strict';
import { estadoPadrao } from '../src/compartilhado/estado-padrao.js';
import { diferencas, carimbar } from '../src/servidor/atividades.js';

const par = () => { const a = estadoPadrao('2026-11-14'); return [a, structuredClone(a)]; };
const textos = (a, d) => diferencas(a, d).map(x => x.texto);

test('descreve conclusão, correção e desfazer', () => {
  const [a, d] = par();
  d.feitos['3-4'] = { d: '2026-11-17', t: 0, e: 'e1' }; d.feitos['3-H'] = { d: '2026-11-17', t: 1, e: 'e2' };
  assert.deepEqual(textos(a, d), ['Concluiu Apto 304 · Equipe 1 · 17/11 manhã', 'Concluiu Hall 3º · Equipe 2 · 17/11 tarde']);
  const e = structuredClone(d); e.feitos['3-4'].t = 1; delete e.feitos['3-H'];
  assert.deepEqual(textos(d, e), ['Corrigiu Apto 304: Equipe 1 · 17/11 tarde (antes: Equipe 1 · 17/11 manhã)', 'Desfez a conclusão de Hall 3º (Equipe 2 · 17/11 tarde)']);
});

test('descreve equipes e configurações; nada mudou = nada registrado', () => {
  const [a, d] = par();
  assert.deepEqual(textos(a, d), []);
  d.equipes.push({ id: 'e5', nome: 'Terceirizada João', tipo: 'terceirizada', cor: 4, ativa: true, entrada: '', pausas: [] });
  d.equipes[0].ativa = false; d.cfg.prazo = '2027-03-24'; d.cfg.feriados.push('2026-12-25'); d.pavs[0].q = 12;
  assert.deepEqual(textos(a, d), ['Retirou a equipe Equipe 1 da obra', 'Adicionou a equipe Terceirizada João', 'Alterou o prazo combinado: de sem data para 24/03/2027', 'Alterou os feriados', 'Alterou os apartamentos por pavimento']);
});

test('muitas conclusões de uma vez viram uma linha só', () => {
  const [a, d] = par();
  for (let k = 1; k <= 14; k++) { d.feitos['1-' + k] = { d: '2026-11-17', t: 0, e: 'e1' }; d.feitos['2-' + k] = { d: '2026-11-17', t: 0, e: 'e1' }; }
  assert.deepEqual(diferencas(a, d).map(x => x.tipo), ['massa']);
});

test('carimbo: só a conclusão nova ou alterada troca de dono', () => {
  const [a, d] = par();
  a.feitos['1-1'] = { d: '2026-11-17', t: 0, e: 'e1', por: 'Mateus', em: 'X' };
  d.feitos['1-1'] = { d: '2026-11-17', t: 0, e: 'e1', por: 'Outro', em: 'Y' };
  d.feitos['1-2'] = { d: '2026-11-17', t: 1, e: 'e1' };
  carimbar(a, d, 'Bruna', 'AGORA');
  assert.deepEqual([d.feitos['1-1'].por, d.feitos['1-1'].em], ['Mateus', 'X']);
  assert.deepEqual([d.feitos['1-2'].por, d.feitos['1-2'].em], ['Bruna', 'AGORA']);
});

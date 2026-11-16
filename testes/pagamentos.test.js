import test from 'node:test';
import assert from 'node:assert/strict';
import { estadoPadrao } from '../src/compartilhado/estado-padrao.js';
import { calcular } from '../src/compartilhado/previsao.js';
import { calcularPagamentos, extratoEquipe, garantirPagamentos, valorPago, formaTexto, PCT_FIXA } from '../src/compartilhado/pagamentos.js';
import { brl, fMes } from '../src/compartilhado/datas.js';
import { diferencas } from '../src/servidor/atividades.js';

const HOJE = { d: '2026-12-10', t: 1 };
/** Obra começando em 16/11/2026, com o 1º pavimento todo "Casal" (m1) e a Equipe 5 terceirizada. */
function obra() {
  const S = estadoPadrao('2026-11-14');
  for (let k = 1; k <= 14; k++) S.pag.modelos['1-' + k] = 'm1';
  S.equipes.push({ id: 'e5', nome: 'Terceirizada', tipo: 'terceirizada', cor: 4, ativa: true, entrada: '', pausas: [] });
  return garantirPagamentos(S);
}
const pag = S => { const R = calcular(S, HOJE); return calcularPagamentos(S, R.c, R.prev); };

test('valores do contrato somam R$ 2.203.061,98 em 250 unidades', () => {
  const S = obra(), total = S.pag.itens.reduce((s, i) => s + i.valor * i.qtd, 0);
  assert.equal(brl(total), 'R$ 2.203.061,98');
  assert.equal(S.pag.itens.reduce((s, i) => s + i.qtd, 0), 250);
});

test('equipe fixa recebe 3% do valor da unidade; terceirizada entra a combinar', () => {
  const S = obra(), [e1] = S.equipes, e5 = S.equipes.at(-1);
  assert.equal(PCT_FIXA, 3); assert.equal(e1.pag.pct, 3); assert.equal(e5.pag.pct, null);
  assert.equal(valorPago(S, e1, { id: '1-1', tipo: 'apto' }).pagar, 233.69); // 3% de 7.789,74
  assert.equal(valorPago(S, e1, { id: '1-H', tipo: 'hall' }).pagar, 163.72); // 3% de 5.457,17
  assert.equal(valorPago(S, e1, { id: 'R', tipo: 'recep' }).pagar, 1667.83); // 3% de 55.594,33
  assert.equal(valorPago(S, e5, { id: '1-1', tipo: 'apto' }).falta, 'combinar');
  assert.equal(valorPago(S, e1, { id: '2-1', tipo: 'apto' }).falta, 'modelo'); // 2º pavimento sem modelo marcado
  assert.equal(formaTexto(e1, brl), '3% do valor da unidade'); assert.equal(formaTexto(e5, brl), 'A combinar');
});

test('valor fixo por unidade não depende do modelo', () => {
  const S = obra(), e5 = S.equipes.at(-1);
  e5.pag = { modo: 'fixo', pct: null, fixo: { apto: 250, hall: null, recep: null } };
  assert.equal(valorPago(S, e5, { id: '2-1', tipo: 'apto' }).pagar, 250);
  assert.equal(valorPago(S, e5, { id: '2-H', tipo: 'hall' }).falta, 'combinar');
  assert.equal(formaTexto(e5, brl), 'Valor fixo: R$ 250,00 por apartamento');
});

test('concluído no dia 30 entra no mês; no dia 1º de manhã já é do mês seguinte', () => {
  const S = obra();
  S.feitos['1-1'] = { d: '2026-11-30', t: 1, e: 'e1' };
  S.feitos['1-2'] = { d: '2026-12-01', t: 0, e: 'e1' };
  S.feitos['1-H'] = { d: '2026-12-02', t: 0, e: 'e1' };
  const P = pag(S);
  assert.equal(P.cel.e1['2026-11'].pagar, 233.69); assert.equal(P.cel.e1['2026-11'].n, 1);
  assert.equal(P.cel.e1['2026-12'].pagar, 397.41); // 233,69 + 163,72
  assert.equal(P.totalMes('2026-11'), 233.69); assert.equal(P.totalEquipe('e1'), 631.1); assert.equal(P.total(), 631.1);
  const nov = extratoEquipe(P, 'e1', '2026-11'), tudo = extratoEquipe(P, 'e1', '');
  assert.deepEqual(nov.linhas.map(l => l.u.nome), ['101']); assert.equal(nov.total, 233.69);
  assert.deepEqual(tudo.linhas.map(l => l.u.nome), ['101', '102', 'Hall 1º']); assert.equal(tudo.total, 631.1);
  assert.equal(fMes('2026-11'), 'novembro de 2026'); assert.equal(fMes('2026-11', true), 'nov/26');
});

test('unidade sem valor definido fica fora da soma e aparece como pendência', () => {
  const S = obra();
  S.feitos['1-1'] = { d: '2026-11-20', t: 0, e: 'e5' }; // terceirizada a combinar
  S.feitos['2-1'] = { d: '2026-11-21', t: 0, e: 'e1' }; // apartamento sem modelo
  const P = pag(S);
  assert.equal(P.total(), 0); assert.equal(P.cel.e5['2026-11'].faltas, 1); assert.equal(P.cel.e1['2026-11'].faltas, 1);
  assert.equal(P.semModelo, 232 - 14); assert.ok(P.aCombinar.some(e => e.id === 'e5'));
  assert.equal(extratoEquipe(P, 'e5', '2026-11').faltas, 1);
});

test('previsão dos meses seguintes soma o que ainda vai ser montado', () => {
  const S = obra(), P = pag(S);
  assert.equal(P.previstas.length, 250); assert.ok(P.meses.includes('2026-12'));
  assert.ok(P.total('prev') > 0); // só o que tem modelo e equipe com valor entra
});

test('obra antiga (sem pagamentos) é completada sem perder nada', () => {
  const S = estadoPadrao('2026-11-14'); delete S.pag; delete S.cfg.recepDias; for (const e of S.equipes) delete e.pag;
  S.feitos['1-1'] = { d: '2026-11-20', t: 0, e: 'e1' };
  assert.ok(calcular(S, HOJE).fim); // a previsão funciona mesmo antes de completar
  garantirPagamentos(S);
  assert.equal(S.pag.itens.length, 6); assert.equal(S.cfg.recepDias, 18); assert.deepEqual(S.pag.itens.map(i => i.dias), [2, 2, 2, 2, 1, 18]); assert.equal(S.pag.salarioFixa, 2500); assert.equal(S.pag.salarioAjudante, 1621); assert.equal(S.pag.encargos, 0); assert.equal(S.equipes[0].pag.pct, 3); assert.ok(S.feitos['1-1']);
});

test('registro de atividades descreve mudanças de pagamento e a recepção', () => {
  const a = obra(), d = structuredClone(a);
  d.equipes.at(-1).pag.pct = 4; d.pag.itens[0].valor = 8000; d.pag.modelos['2-1'] = 'm2'; d.feitos.R = { d: '2026-12-01', t: 0, e: 'e1' };
  const t = diferencas(a, d).map(i => i.texto);
  assert.ok(t.includes('Concluiu Recepção · Equipe 1 · 01/12 manhã'));
  assert.ok(t.includes('Alterou o pagamento da equipe Terceirizada: 4% do valor da unidade (antes: A combinar)'));
  assert.ok(t.includes('Alterou o valor de Apartamento 01 - Casal: de R$ 7.789,74 para R$ 8.000,00'));
  assert.ok(t.includes('Alterou o modelo do Apto 201'));
});

test('meta de dias por modelo, hall e recepção muda a previsão; sem modelo vale o prazo geral', () => {
  const dia = { d: '2026-11-14', t: 1 }, fim = S => calcular(S, dia).fim.d, base = fim(estadoPadrao(dia.d));
  const peso = (S, id) => calcular(S, dia).c.porId.get(id).peso, item = (S, id) => S.pag.itens.find(i => i.id === id);
  const S = estadoPadrao(dia.d);
  assert.equal(peso(S, '1-1'), 1); assert.equal(peso(S, '1-H'), .5); assert.equal(peso(S, 'R'), 9);
  S.pag.modelos['1-1'] = 'm4'; item(S, 'm4').dias = 3; item(S, 'hall').dias = 2; item(S, 'recep').dias = 20;
  assert.equal(peso(S, '1-1'), 1.5); assert.equal(peso(S, '1-2'), 1); assert.equal(peso(S, '1-H'), 1); assert.equal(peso(S, 'R'), 10);
  assert.ok(fim(S) > base, 'metas maiores empurram o término');
  const R = estadoPadrao(dia.d); item(R, 'recep').dias = 1; item(R, 'hall').dias = .5;
  assert.ok(fim(R) < base, 'metas menores adiantam o término');
  const a = estadoPadrao(dia.d), d = structuredClone(a); item(d, 'm3').dias = 2.5;
  assert.deepEqual(diferencas(a, d).map(i => i.texto), ['Alterou a meta de montagem de Apartamento 03 - 3 Camas: de 2 para 2,5 dias']);
});

test('vale a pena terceirizar: o teto fica perto de salário + percentual da equipe fixa', async () => {
  const { cenariosTerceirizar, valorMedioApto } = await import('../src/compartilhado/terceirizar.js');
  const S = estadoPadrao('2026-11-14'), dia = { d: '2026-11-14', t: 1 }, R = calcular(S, dia);
  assert.equal(Math.round(valorMedioApto(S) * 100) / 100, 8856.45);
  const C = cenariosTerceirizar(S, R, { salario: 2500, entrada: S.cfg.inicio, pct: 4, max: 3 });
  assert.equal(C.length, 4); assert.equal(C[0].k, 0); assert.equal(C[0].vTerc, 0); assert.equal(C[0].fixas, 4);
  assert.ok(Math.abs(C[0].comissao - 66091.86) < 1); // 3% do contrato inteiro (sem modelo usa o valor médio)
  for (const x of C.slice(1)) {
    assert.ok(x.fim < C[0].fim, 'mais equipes terminam antes'); assert.ok(x.salarios < C[0].salarios);
    assert.ok(x.pctMax > 5 && x.pctMax < 6, 'teto: 3% + o salário diluído no que a equipe monta'); // ~5,5%
    assert.ok(x.saldo > 0, 'pagando 4% sobra dinheiro'); assert.equal(Math.round((x.economia - x.custoTerc - x.saldo) * 100), 0);
  }
  const caro = cenariosTerceirizar(S, R, { salario: 2500, entrada: S.cfg.inicio, pct: 8, max: 2 });
  assert.ok(caro.slice(1).every(x => x.saldo < 0), 'pagando 8% a obra fica mais cara');
  const { custoMensalFixa } = await import('../src/compartilhado/pagamentos.js');
  assert.equal(custoMensalFixa(S), 4121); S.pag.encargos = 50; assert.equal(custoMensalFixa(S), 6181.5); S.pag.encargos = 0;
  const comAjudante = cenariosTerceirizar(S, R, { salario: custoMensalFixa(S), entrada: S.cfg.inicio, max: 2 });
  assert.ok(comAjudante.slice(1).every(x => x.pctMax > 6.5 && x.pctMax < 8), 'com o ajudante na conta o teto sobe para perto de 7%');
  const comLucro = cenariosTerceirizar(S, R, { salario: custoMensalFixa(S), entrada: S.cfg.inicio, lucroMes: 30000, max: 2 });
  assert.ok(comLucro[1].pctMax > comAjudante[1].pctMax + 5, 'o lucro parado da loja pesa mais que os salários');
  assert.equal(Math.round(comLucro[1].lucroLiberado), Math.round(30000 * (comLucro[0].meses - comLucro[1].meses)));
  const semSalario = cenariosTerceirizar(S, R, { salario: 0, entrada: S.cfg.inicio, max: 2 });
  assert.ok(semSalario.slice(1).every(x => Math.abs(x.pctMax - 3) < .01), 'sem salário, o teto é o mesmo percentual da fixa');
});

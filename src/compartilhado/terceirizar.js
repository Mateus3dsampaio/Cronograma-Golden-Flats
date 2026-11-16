import { dn } from './datas.js';
import { preverComN } from './previsao.js';
import { itemDe, valorPago } from './pagamentos.js';

/**
 * Vale a pena trazer equipes terceirizadas? Só contas, sem tela.
 *
 * Raciocínio (pedido do Mateus em 16/11/2026): a equipe fixa custa o salário do mês em que fica presa na obra
 * mais o percentual do que monta. Com equipes a mais a obra acaba antes, então gasta menos salário de equipe fixa;
 * em troca, a terceirizada monta parte das unidades (e a fixa deixa de ganhar o percentual delas).
 * O que sobra dessa troca é o máximo que dá para pagar à terceirizada sem a obra ficar mais cara.
 *
 * Premissas: a equipe nova monta no ritmo médio da obra (igual a uma fixa) e o salário só é "economizado"
 * se a equipe fixa liberada antes for produzir em outro serviço da loja.
 */
const MES = 30.44; // dias corridos de um mês médio

/** Valor médio de um apartamento pelo contrato (usado quando o apartamento ainda não tem modelo marcado). */
export function valorMedioApto(S) {
  const m = S.pag.itens.filter(i => i.tipo === 'apto'), q = m.reduce((s, i) => s + i.qtd, 0);
  return q ? m.reduce((s, i) => s + i.valor * i.qtd, 0) / q : 0;
}

/**
 * Um cenário por quantidade de equipes terceirizadas a mais (0 = só as equipes de hoje).
 * salario = salário mensal de uma equipe fixa · entrada = dia em que as novas começam · pct = % que se pretende pagar (ou null)
 * Cada cenário: { k, fim, meses, fixas, salarios, comissao, vTerc, nTerc, custoSem, economia, pctMax, porApto, custoTerc, saldo }
 */
export function cenariosTerceirizar(S, R, { salario, entrada, pct = null, max = 6 }) {
  const c = R.c, medio = valorMedioApto(S), fixas = c.ativos.filter(e => e.tipo === 'fixa').length;
  const inicio = dn(c.ag.d < S.cfg.inicio ? S.cfg.inicio : c.ag.d);
  const equipe = id => S.equipes.find(e => e.id === id);
  const valor = u => { const i = itemDe(S, u); return i ? i.valor : medio; };
  const cenarios = [];
  for (let k = 0; k <= max; k++) {
    const prev = preverComN(c, S, c.ativos.length + k, entrada, S.cfg.base);
    if (!prev || prev.pronto || !prev.plano.size) return [];
    let comissao = 0, vTerc = 0, nTerc = 0, aCombinar = 0;
    prev.plano.forEach(p => {
      const e = equipe(p.eq);
      if (!e) { vTerc += valor(p.u); nTerc++; return; } // equipe nova (terceirizada simulada)
      const pg = valorPago(S, e, p.u);
      if (pg.pagar != null) comissao += pg.pagar;
      else if (pg.falta === 'modelo') comissao += medio * pg.pct / 100; // sem modelo marcado: usa o valor médio do contrato
      else aCombinar++;
    });
    const fim = c.cal.em(prev.fimT).d, meses = Math.max(0, dn(fim) - inicio + 1) / MES, salarios = fixas * salario * meses;
    cenarios.push({ k, fim, meses, fixas, salarios, comissao, vTerc, nTerc, aCombinar, custoSem: salarios + comissao });
  }
  const base = cenarios[0];
  for (const x of cenarios) {
    x.economia = base.custoSem - x.custoSem;               // o que deixa de gastar com as equipes de hoje
    x.pctMax = x.vTerc > 0 ? x.economia / x.vTerc * 100 : null; // até quanto dá para pagar à terceirizada (empate)
    x.porApto = x.pctMax == null ? null : medio * x.pctMax / 100;
    x.custoTerc = pct == null ? null : x.vTerc * pct / 100;
    x.saldo = pct == null ? null : x.economia - x.custoTerc; // positivo = a obra sai mais barata com terceirizadas
  }
  return cenarios;
}

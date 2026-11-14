import { fData, fCurta, TURNO } from './datas.js';

/**
 * O que o cliente da obra pode ver: só a previsão de liberação de cada pavimento.
 * Usado na aba Cliente e na página pública do link do cliente (montada no servidor).
 */
export function linhasCliente(S, R) {
  const mg = (S.cfg.margemCliente || 0) * 2;
  return [...S.pavs].sort((a, b) => a.n - b.n).map(p => {
    const i = R.pav[p.n], pronto = i.feitos === i.tot;
    const s = i.fimT && !i.incerto ? R.c.cal.em(i.fimT + (pronto ? 0 : mg)) : null;
    return { n: p.n, q: p.q, pc: i.tot ? i.feitos / i.tot * 100 : 0, pronto, s, est: pronto ? 'Liberado' : i.feitos || i.and ? 'Em montagem' : 'Aguardando' };
  });
}

/** Data de conclusão total que o cliente vê (com a margem de segurança). */
export function fimCliente(S, R) {
  if (!R.fim) return null;
  return R.feitas === R.tot ? R.fim : R.c.cal.em(R.prev.fimT + (S.cfg.margemCliente || 0) * 2);
}

/** Resumo pronto para a página pública do cliente (nada de equipes nem de ritmo). */
export function resumoCliente(S, R) {
  return { nome: S.cfg.nome, atualizado: R.c.ag.d, liberados: R.liberados, pavimentos: S.pavs.length, fim: fimCliente(S, R), linhas: linhasCliente(S, R) };
}

export function textoCliente(S, R) {
  const fim = fimCliente(S, R);
  return `*${S.cfg.nome} · previsão de liberação dos pavimentos*\nAtualizado em ${fData(R.c.ag.d)}\n\n`
    + linhasCliente(S, R).map(l => l.pronto ? `✅ ${l.n}º pavimento: liberado em ${fCurta(l.s.d)}` : `${l.n}º pavimento: ${l.s ? fData(l.s.d) + ' (' + TURNO[l.s.t] + ')' : 'a definir'}`).join('\n')
    + `\n\nConclusão total prevista: ${fim ? fData(fim.d) : 'a definir'}\nDatas previstas com base no andamento da montagem; podem ser ajustadas.`;
}

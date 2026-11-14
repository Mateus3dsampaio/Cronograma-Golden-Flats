import { dsem, DS, TURNO, fData, num, plural } from '/compartilhado/datas.js';

/** Tabela de liberação dos pavimentos. Usada na aba Cliente e na página pública do link do cliente. */
export function tabelaCliente(linhas) {
  return `<table class="tab"><thead><tr><th>Pavimento</th><th>Unidades</th><th style="width:30%">Avanço</th><th>Situação</th><th>Liberação</th></tr></thead><tbody>
    ${linhas.map(l => `<tr><td><b>${l.n}º pavimento</b></td><td>${plural(l.q, 'apto', 'aptos')} + hall</td>
      <td><div style="display:grid;grid-template-columns:1fr 44px;gap:12px;align-items:center"><div class="barra ${l.pronto ? 'ok' : ''}"><i style="width:${l.pc}%"></i></div><b class="dir">${num(l.pc)}%</b></div></td>
      <td><span class="selo ${l.pronto ? 'ok' : l.est === 'Em montagem' ? 'mc' : 'nt'}">${l.est}</span></td>
      <td>${l.s ? `<b>${fData(l.s.d)}</b> <span class="mudo">${DS[dsem(l.s.d)]} · ${l.pronto ? 'entregue' : 'fim da ' + TURNO[l.s.t]}</span>` : '<span class="mudo">sem previsão</span>'}</td></tr>`).join('')}
  </tbody></table>`;
}

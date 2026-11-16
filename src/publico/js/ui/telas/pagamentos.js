import { app, eq } from '../../nucleo/contexto.js';
import { calcularPagamentos, extratoEquipe, formaTexto, modelosApto } from '/compartilhado/pagamentos.js';
import { fData, fMes, brl, plural, TURNO } from '/compartilhado/datas.js';
import { esc, cor } from '../dom.js';
import { fQuando } from '../formato.js';

const num = v => v == null ? '' : v; // valor de um campo numérico (vazio = a combinar)

/** Aba Pagamentos: quanto cada equipe recebe em cada mês, como cada uma é paga e os valores do contrato. */
export function pagamentos() {
  const { S, R } = app, P = calcularPagamentos(S, R.c, R.prev);
  if (app.extrato && eq(app.extrato.e)) return extrato(P);
  const hoje = R.c.ag.d.slice(0, 7), i = P.meses.indexOf(hoje), ant = i > 0 ? P.meses[i - 1] : null;
  const avisos = [];
  if (P.semModelo) avisos.push(`<button class="selo av" data-a="ir" data-aba="config">${plural(P.semModelo, 'apartamento', 'apartamentos')} sem modelo marcado · marcar em Configurações</button>`);
  for (const e of P.aCombinar) avisos.push(`<span class="selo av">${esc(e.nome)}: pagamento a combinar</span>`);
  return `<div class="grade entra">
    <div><div class="kpis pg-kpis">
      ${kpi('A pagar em ' + fMes(hoje), P.totalMes(hoje), `${plural(contar(P, hoje), 'unidade concluída', 'unidades concluídas')} até agora`)}
      ${kpi(ant ? 'Fechado em ' + fMes(ant) : 'Mês anterior', ant ? P.totalMes(ant) : null, ant ? plural(contar(P, ant), 'unidade', 'unidades') : 'Sem conclusões antes deste mês')}
      ${kpi('Total já montado', P.total(), plural(P.linhas.length, 'unidade', 'unidades') + ' desde o início')}
      ${kpi('Ainda a montar (previsão)', P.total('prev'), plural(P.previstas.length, 'unidade', 'unidades') + ' pela previsão atual')}
    </div>${avisos.length ? `<div class="avisos">${avisos.join('')}</div>` : ''}</div>
    <div class="card"><div class="rot"><span>Pagamento por equipe e por mês</span><span class="mudo" style="letter-spacing:0;text-transform:none;font-weight:500">Vale a data da conclusão: até o último dia entra no mês; no dia 1º já é do mês seguinte</span></div>
      <div class="rolagem">${tabela(P, hoje)}</div>
      <p class="mudo" style="margin-top:12px;font-size:12px">Clique num valor para abrir o extrato da equipe naquele mês. O número menor, em cinza, é o que ainda deve ser montado no mês pela previsão do cronograma: muda conforme a obra anda.</p></div>
    <div class="grade pg-baixo">
      <div class="card"><div class="rot">Como cada equipe é paga</div><div class="pg-eqs">${S.equipes.map(formaEquipe).join('')}</div>
        <p class="mudo" style="margin-top:12px;font-size:12px">Percentual: aplicado sobre o valor da unidade montada. Valor fixo: um valor em reais por unidade, sem depender do modelo. Em branco = a combinar (não entra na soma).</p></div>
      <div class="card"><div class="rot">Valores do contrato</div>${contrato()}</div>
    </div></div>`;
}

const contar = (P, mes) => P.linhas.filter(l => l.mes === mes).length;
const kpi = (rot, v, sub) => `<div class="card kpi"><div class="rot">${rot}</div><div class="v">${v == null ? '—' : brl(v)}</div><div class="s">${sub}</div></div>`;

/** Tabela equipe × mês. */
function tabela(P, hoje) {
  const { S } = app, eqs = S.equipes.filter(e => e.ativa || P.cel[e.id]);
  const casa = (e, m) => {
    const k = (P.cel[e.id] || {})[m]; if (!k) return '<td class="dir mudo">—</td>';
    const real = k.n ? `<button class="pg-v" data-a="pg-extrato" data-e="${e.id}" data-mes="${m}" data-dica="${plural(k.n, 'unidade concluída', 'unidades concluídas')}${k.faltas ? ' · ' + k.faltas + ' sem valor definido' : ''}\nClique para ver o extrato">${k.faltas === k.n ? (k.n > 1 ? k.n + ' unidades' : '1 unidade') + ' · a definir' : brl(k.pagar)}${k.faltas ? '<i>!</i>' : ''}</button>` : '';
    const prev = k.nPrev ? `<small data-dica="Previsão: mais ${plural(k.nPrev, 'unidade', 'unidades')} neste mês${k.faltasPrev ? ' (' + k.faltasPrev + ' sem valor definido)' : ''}">${k.faltasPrev === k.nPrev ? '+ ' + plural(k.nPrev, 'unidade', 'unidades') + ' a definir' : '+ ' + brl(k.prev)}</small>` : '';
    return `<td class="dir">${real}${prev}</td>`;
  };
  return `<table class="tab pg-tab"><thead><tr><th>Equipe</th>${P.meses.map(m => `<th class="dir ${m === hoje ? 'atual' : ''}">${fMes(m, true)}${m === hoje ? ' · mês atual' : ''}</th>`).join('')}<th class="dir">Total montado</th><th></th></tr></thead>
    <tbody>${eqs.map(e => `<tr><td><span class="pg-nome"><i class="ponto" style="color:${cor(e)};background:${cor(e)}"></i><b>${esc(e.nome)}</b></span><small class="mudo">${esc(formaTexto(e, brl))}</small></td>
      ${P.meses.map(m => casa(e, m)).join('')}<td class="dir"><b>${brl(P.totalEquipe(e.id))}</b></td>
      <td class="dir"><button class="btn mini" data-a="pg-extrato" data-e="${e.id}" data-mes="${hoje}">Extrato</button></td></tr>`).join('') || `<tr><td colspan="${P.meses.length + 3}" class="mudo">Nenhuma equipe cadastrada.</td></tr>`}</tbody>
    <tfoot><tr><td><b>Total</b></td>${P.meses.map(m => `<td class="dir">${contar(P, m) ? '<b>' + brl(P.totalMes(m)) + '</b>' : '<span class="mudo">—</span>'}${P.totalMes(m, 'prev') ? `<small>+ ${brl(P.totalMes(m, 'prev'))}</small>` : ''}</td>`).join('')}<td class="dir"><b>${brl(P.total())}</b></td><td></td></tr></tfoot></table>`;
}

/** Linha de uma equipe no cartão "Como cada equipe é paga". */
function formaEquipe(e) {
  const p = e.pag, fixo = p.modo === 'fixo';
  const campo = (rot, k, v) => `<label class="campo">${rot}<input type="number" min="0" step="0.01" inputmode="decimal" placeholder="a combinar" data-pg="${k}" data-e="${e.id}" value="${num(v)}"></label>`;
  return `<div class="pg-eq ${e.ativa ? '' : 'fora'}"><div class="pg-nome"><i class="ponto" style="color:${cor(e)};background:${cor(e)}"></i><b>${esc(e.nome)}</b><span class="selo ${e.tipo === 'fixa' ? 'mc' : 'nt'}">${e.tipo === 'fixa' ? 'fixa' : 'terceirizada'}</span>${e.ativa ? '' : '<span class="selo nt">saiu</span>'}</div>
    <div class="seg"><button class="${fixo ? '' : 'on'}" data-a="pg-modo" data-e="${e.id}" data-v="pct">Percentual</button><button class="${fixo ? 'on' : ''}" data-a="pg-modo" data-e="${e.id}" data-v="fixo">Valor fixo</button></div>
    <div class="pg-campos">${fixo ? campo('R$ por apartamento', 'apto', p.fixo.apto) + campo('R$ por hall', 'hall', p.fixo.hall) + campo('R$ pela recepção', 'recep', p.fixo.recep) : campo('% do valor da unidade', 'pct', p.pct)}</div></div>`;
}

/** Valores do contrato: os quatro modelos de apartamento, o hall e a recepção. */
function contrato() {
  const { S, R } = app, marc = {};
  for (const u of R.c.unidades) { const id = u.tipo === 'apto' ? S.pag.modelos[u.id] : u.tipo; if (id) marc[id] = (marc[id] || 0) + 1; }
  const total = S.pag.itens.reduce((s, i) => s + i.valor * i.qtd, 0);
  return `<table class="tab pg-contrato"><thead><tr><th>Item</th><th class="dir">Contrato</th><th class="dir">No sistema</th><th class="dir">Valor por unidade</th></tr></thead>
    <tbody>${S.pag.itens.map(i => { const n = marc[i.id] || 0; return `<tr><td>${esc(i.nome)}</td><td class="dir">${i.qtd}</td>
      <td class="dir"><span class="selo ${n === i.qtd ? 'ok' : 'av'}" data-dica="${n === i.qtd ? 'Confere com o contrato' : i.tipo === 'apto' ? 'Apartamentos marcados com este modelo em Configurações' : 'Quantidade no cronograma diferente do contrato'}">${n}</span></td>
      <td class="dir"><label class="campo pg-valor"><input type="number" min="0" step="0.01" inputmode="decimal" data-pg="valor" data-id="${i.id}" value="${i.valor}" aria-label="Valor de ${esc(i.nome)}"></label></td></tr>`; }).join('')}</tbody>
    <tfoot><tr><td colspan="3"><b>Total do contrato</b></td><td class="dir"><b>${brl(total)}</b></td></tr></tfoot></table>
    <p class="mudo" style="margin-top:12px;font-size:12px">"No sistema" é quantas unidades de cada item existem no cronograma. O modelo de cada apartamento é marcado em Configurações.</p>`;
}

/** Extrato de uma equipe: o que ela concluiu no mês e quanto recebe. É a folha que vira PDF. */
function extrato(P) {
  const { S, R } = app, e = eq(app.extrato.e), mes = app.extrato.mes, X = extratoEquipe(P, e.id, mes);
  const mesesEq = P.meses.filter(m => (P.cel[e.id] || {})[m]?.n || m === mes);
  return `<div class="grade entra">
    <div class="linha nao-imp"><button class="btn" data-a="pg-voltar">← Voltar</button>
      <label class="campo pg-sel"><select data-pg="ext-eq" aria-label="Equipe">${S.equipes.map(x => `<option value="${x.id}" ${x.id === e.id ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}</select></label>
      <label class="campo pg-sel"><select data-pg="ext-mes" aria-label="Mês"><option value="" ${mes ? '' : 'selected'}>Todos os meses</option>${mesesEq.map(m => `<option value="${m}" ${m === mes ? 'selected' : ''}>${fMes(m)}</option>`).join('')}</select></label>
      <button class="btn pri" data-a="pg-imprimir" style="margin-left:auto">Imprimir / PDF</button></div>
    <div class="card extrato">
      <div class="ext-cab"><div><div class="rot">Extrato de montagem</div><h2>${esc(e.nome)}</h2><p class="mudo">${esc(S.cfg.nome)} · ${mes ? fMes(mes) : 'todos os meses'}</p></div>
        <div class="ext-marcas"><img class="italinea" src="/img/italinea.svg" alt="Italínea"><span>Eccellenza</span></div></div>
      <dl class="ext-dados"><dt>Período</dt><dd>${mes ? 'Unidades concluídas em ' + fMes(mes) : 'Todas as unidades concluídas'}</dd>
        <dt>Forma de pagamento</dt><dd>${esc(formaTexto(e, brl))}</dd><dt>Emitido em</dt><dd>${fQuando(new Date().toISOString())}</dd></dl>
      ${X.linhas.length ? `<table class="tab ext-tab"><thead><tr><th>Nº</th><th>Unidade</th><th>Modelo</th><th>Concluído em</th><th class="dir">Valor da unidade</th><th class="dir">%</th><th class="dir">A pagar</th></tr></thead>
        <tbody>${X.linhas.map((l, k) => `<tr><td>${k + 1}</td><td><b>${l.u.tipo === 'apto' ? 'Apto ' : ''}${esc(l.u.nome)}</b></td><td>${l.item ? esc(l.item.nome) : '<span class="selo av">sem modelo</span>'}</td>
          <td>${fData(l.f.d)} · ${TURNO[l.f.t]}</td><td class="dir">${l.base == null ? '—' : brl(l.base)}</td><td class="dir">${l.pct == null ? '—' : String(l.pct).replace('.', ',') + '%'}</td>
          <td class="dir">${l.falta ? `<span class="selo av">${l.falta === 'modelo' ? 'falta o modelo' : 'a combinar'}</span>` : '<b>' + brl(l.pagar) + '</b>'}</td></tr>`).join('')}</tbody>
        <tfoot><tr><td colspan="6"><b>Total a pagar · ${plural(X.linhas.length, 'unidade', 'unidades')}</b></td><td class="dir"><b class="ext-total">${brl(X.total)}</b></td></tr></tfoot></table>
        ${X.faltas ? `<p class="selo av" style="margin-top:12px">${plural(X.faltas, 'unidade', 'unidades')} sem valor definido: o total ainda não está completo.</p>` : ''}
        <div class="ext-ass"><div>Eccellenza</div><div>${esc(e.nome)}</div></div>`
      : `<p class="mudo">Nenhuma unidade concluída por esta equipe ${mes ? 'em ' + fMes(mes) : 'até agora'}.</p>`}
    </div></div>`;
}

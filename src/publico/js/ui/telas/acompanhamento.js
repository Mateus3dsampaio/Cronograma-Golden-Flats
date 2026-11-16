import { app, eq } from '../../nucleo/contexto.js';
import { fData, fCurta, fSem, TURNO, num, plural } from '/compartilhado/datas.js';
import { esc, cor } from '../dom.js';
import { seloAtraso, diasApto, marcadoPor } from '../formato.js';

/** Aba Acompanhamento: situação em uma frase, números, mapa do edifício, gráfico e ranking das equipes. */
export function acompanhamento() {
  const { S, R, DEMO } = app;
  return `<div class="grade entra">
  ${veredito()}
  <div class="grade topo-painel">${heroi()}${indicadores()}</div>
  <div class="card"><div class="rot"><span>Edifício · clique na unidade para marcar</span><span class="legenda"><span><i></i>a fazer</span><span><i style="background:#1b2a46;border-color:var(--marca-txt)"></i>em montagem</span><span><i style="background:#1f7044;border-color:#3bb873"></i>concluído (traço = manhã ou tarde)</span></span></div><div class="predio">${predio()}</div></div>
  <div class="grade baixo-painel">
    <div class="card graf"><div class="rot"><span>Avanço: realizado, previsão e prazo</span><span class="legenda"><span><i style="background:var(--ok);border:0;height:3px"></i>realizado</span><span><i style="background:var(--marca-txt);border:0;height:3px"></i>previsão</span><span><i style="background:var(--aviso);border:0;height:3px"></i>ritmo para o prazo</span></span></div><div id="grafico"></div></div>
    <div class="card"><div class="rot"><span>Velocidade das equipes</span><span class="mudo" style="letter-spacing:0;text-transform:none;font-weight:500">planejado: ${num(S.cfg.aptoDias, 1)} d/apto</span></div><div class="rank">${ranking()}</div></div>
  </div></div>`;
}

/** A frase do topo: adiantado ou atrasado, e o que fazer. */
function veredito() {
  const { S, R, DEMO } = app, { c } = R, n = c.ativos.length, ritmo = S.cfg.base === 'plano' ? 'planejado' : 'atual';
  let v;
  if (R.feitas === R.tot && R.tot) v = { k: 'ok', ic: '✓', t: `<b>Montagem concluída</b> em ${fData(R.fim.d)}. ${R.atraso != null ? (R.atraso > 0 ? `${plural(R.atraso, 'dia', 'dias')} depois do prazo.` : 'Dentro do prazo.') : ''}` };
  else if (!n) v = { k: 'al', ic: '!', t: '<b>Nenhuma equipe ativa.</b> Cadastre ou reative uma equipe para ter previsão.' };
  else if (!R.prazo) v = { k: 'nt', ic: 'i', t: `No ritmo ${ritmo}, com <b>${plural(n, 'equipe', 'equipes')}</b>, a montagem termina em <b>${fData(R.fim.d)}</b>. Informe o prazo combinado em Configurações para eu dizer se está adiantado ou atrasado.` };
  else if (R.atraso > 0) v = { k: R.atraso > 7 ? 'al' : 'av', ic: '!', t: `No ritmo ${ritmo} a montagem termina em <b>${fData(R.fim.d)}</b>: <b>${plural(R.atraso, 'dia', 'dias')} depois do prazo</b> (${fData(R.prazo)}). ${R.precisa ? `Para cumprir o prazo: <b>${plural(R.precisa, 'equipe', 'equipes')}</b> (${R.precisa > n ? '+' + (R.precisa - n) : 'as mesmas de hoje'}) a partir de ${fSem(R.prox)}.` : 'Nem com 60 equipes dá para cumprir esse prazo.'}` };
  else v = { k: 'ok', ic: '✓', t: `No ritmo ${ritmo} a montagem termina em <b>${fData(R.fim.d)}</b>: ${R.atraso < 0 ? `<b>${plural(-R.atraso, 'dia', 'dias')} antes do prazo</b>` : '<b>em cima do prazo</b>'} (${fData(R.prazo)}). ${R.precisa && R.precisa < n ? `O prazo fecha até com <b>${plural(R.precisa, 'equipe', 'equipes')}</b> (hoje são ${n}).` : R.precisa === n ? 'Sem folga de equipe: não dá para tirar nenhuma.' : ''}` };
  const avisos = [];
  if (!app.persistente) avisos.push(`<span class="selo al">Servidor sem Volume: os dados somem na próxima publicação. Veja docs/colocar-no-ar.md</span>`);
  if (!S.conferido && !DEMO) avisos.push(`<span class="selo av">Confira data de início, prazo e pavimentos em Configurações</span>`);
  for (const p of R.paradas) avisos.push(`<span class="selo al">${esc(p.e.nome)}: ${plural(p.dias, 'dia útil', 'dias úteis')} sem concluir (${esc(R.atual[p.e.id].u.nome)})</span>`);
  return `<div><div class="veredito ${v.k}"><div class="ic">${v.ic}</div><div>${v.t}</div><div class="acoes nao-imp">${R.prazo && R.feitas < R.tot ? '<button class="btn mini" data-a="ir" data-aba="simul">Simular equipes</button>' : ''}</div></div>${avisos.length ? `<div class="avisos">${avisos.join('')}</div>` : ''}</div>`;
}

/** Cartão da esfera com o % total (a esfera é encaixada depois, em desenhar.js). */
function heroi() {
  const { R } = app;
  const { S, c } = { S: app.S, c: R.c }, emPav = S.pavs.filter(p => R.pav[p.n].feitos < R.pav[p.n].tot && (R.pav[p.n].feitos || R.pav[p.n].and)).length;
  return `<div class="card heroi"><div id="lugar-predio"></div><div>
    <div class="rot">Montagem concluída</div>
    <div class="pct"><span data-n="${R.pct}" data-dec="1">${num(R.pct, 1)}</span><small>%</small></div>
    <div class="barra ${R.pct === 100 ? 'ok' : ''}" style="margin-top:12px"><i style="width:${R.pct}%"></i></div>
    <dl><dt>Apartamentos</dt><dd>${R.aptosFeitos} / ${R.aptosTot}</dd><dt>Halls</dt><dd>${R.hallsFeitos} / ${R.hallsTot}</dd><dt>Recepção</dt><dd>${R.recepFeita ? 'concluída' : 'a fazer'}</dd>
      <dt>Em montagem</dt><dd>${plural(R.emAnd.size, 'unidade', 'unidades')}</dd><dt>Faltam</dt><dd>${plural(R.tot - R.feitas, 'unidade', 'unidades')}</dd>
      <dt>Pav. liberados</dt><dd>${R.liberados} / ${S.pavs.length}</dd><dt>Pav. em andamento</dt><dd>${emPav}</dd>
      ${R.proximo ? `<dt>Próximo a liberar</dt><dd>${R.proximo.n}º · ${fSem(c.cal.em(R.proximo.fimT).d)}</dd>` : ''}</dl>
    <div class="legenda v3d-leg"><span><i style="background:#4b5d76;border-color:#62779a"></i>a fazer</span><span><i style="background:#4a80f0;border-color:#8aaaf0"></i>em montagem</span><span><i style="background:#3fc47c;border-color:#8ff0b5"></i>concluído</span></div>
    <p class="v3d-dica nao-imp">Arraste para girar · role para aproximar · clique num pavimento para ir até ele</p>
  </div></div>`;
}

/** Dados de cada pavimento para o prédio 3D, de baixo para cima: estado de cada unidade e o texto da etiqueta. */
export function pavimentos3d() {
  const { S, R } = app, { c } = R;
  return [...S.pavs].sort((a, b) => a.n - b.n).map(p => {
    const info = R.pav[p.n], us = c.unidades.filter(u => u.pav === p.n), s = info.fimT ? c.cal.em(info.fimT) : null;
    const estados = us.map(u => c.feito.has(u.id) ? 2 : R.emAnd.has(u.id) ? 1 : 0), and = estados.filter(x => x === 1).length;
    const prev = info.feitos === info.tot ? `Liberado ${fCurta(s.d)}` : info.incerto || !s ? 'Sem previsão' : `Libera ${fSem(s.d)} · ${TURNO[s.t]}`;
    return { n: p.n, estados, etiqueta: `<b>${p.n}º pavimento</b>${info.feitos} de ${info.tot} concluídas${and ? ` · ${and} em montagem` : ''}<br>${prev}` };
  });
}

/** Os quatro números principais. */
function indicadores() {
  const { S, R } = app, { c, prev } = R, n = c.ativos.length, fimS = R.fim, restDias = fimS ? Math.max(0, Math.ceil((prev.fimT - c.now) / 2)) : 0;
  return `<div class="kpis">
    <div class="card kpi"><div class="rot">Previsão de término</div><div class="v">${fimS ? fData(fimS.d) : '—'}</div><div class="s">${fimS && R.feitas < R.tot ? `${TURNO[fimS.t]} · ${plural(restDias, 'dia útil', 'dias úteis')} de obra` : ''} ${seloAtraso(R.atraso)}</div></div>
    <div class="card kpi"><div class="rot">Ritmo (aptos por semana)</div><div class="v">${R.ritmoRec != null ? `<span data-n="${R.ritmoRec}" data-dec="1">${num(R.ritmoRec, 1)}</span>` : num(R.capacidade, 1)}<small>${R.ritmoRec != null ? 'nas últimas 2 semanas' : 'capacidade das equipes'}</small></div>
      <div class="s">${R.ritmoNec != null ? `Necessário para o prazo: <b>${isFinite(R.ritmoNec) ? num(R.ritmoNec, 1) : '∞'}</b> ${R.ritmoRec != null ? (R.ritmoRec >= R.ritmoNec ? '<span class="selo ok">acima</span>' : '<span class="selo al">abaixo</span>') : ''}` : 'Capacidade atual: ' + num(R.capacidade, 1) + ' por semana'}</div></div>
    <div class="card kpi"><div class="rot">Equipes</div><div class="v"><span data-n="${n}">${n}</span><small>${n === 1 ? 'ativa' : 'ativas'}</small></div>
      <div class="s">${R.precisa ? `Para o prazo: <b>${R.precisa}</b> ${R.precisa > n ? `<span class="selo al">faltam ${R.precisa - n}</span>` : R.precisa < n ? `<span class="selo ok">sobram ${n - R.precisa}</span>` : '<span class="selo ok">na medida</span>'}` : `Média real: ${c.brutoGeral ? diasApto(c.brutoGeral) + ' dias por apto' : 'ainda sem dados'}`}</div></div>
    <div class="card kpi"><div class="rot">Pavimentos liberados</div><div class="v"><span data-n="${R.liberados}">${R.liberados}</span><small>de ${S.pavs.length}</small></div>
      <div class="s">${R.proximo ? `Próximo: <b>${R.proximo.n}º</b> em ${fSem(c.cal.em(R.proximo.fimT).d)}` : ''}</div></div>
  </div>`;
}

/** Mapa do edifício: uma linha por pavimento (o mais alto em cima), uma célula por unidade. */
function predio() {
  const { S, R } = app, { c, prev } = R, maxQ = Math.max(1, ...S.pavs.map(p => p.q)); let i = 0;
  const cel = u => {
    const f = c.feito.get(u.id), e = R.emAnd.get(u.id), pl = prev && prev.plano.get(u.id), rot = u.tipo === 'hall' ? 'HALL' : u.tipo === 'recep' ? 'RECEPÇÃO' : u.nome;
    let cls = 'cel' + (u.tipo === 'apto' ? '' : ' hall'), est = `style="--i:${i++}"`, dica;
    if (f) { cls += ' ok t' + f.t; dica = `${u.nome}\nConcluído ${fSem(f.d)} · ${TURNO[f.t]}\n${eq(f.e) ? eq(f.e).nome : ''}${f.por ? '\n' + marcadoPor(f) : ''}`; }
    else if (e) { cls += ' and'; est = `style="--c:${cor(eq(e))};--i:${i}"`; const s = c.cal.em(pl.fim); dica = `${u.nome}\nEm montagem · ${eq(e).nome}\nPrevisão: ${fSem(s.d)} · ${TURNO[s.t]}`; }
    else if (pl) { const s = c.cal.em(pl.fim), q = eq(pl.eq); dica = `${u.nome}\nPrevisão: ${fSem(s.d)} · ${TURNO[s.t]}\n${q ? q.nome : ''}${S.fixos[u.id] ? ' (reservado)' : ''}`; }
    else dica = `${u.nome}\nSem previsão`;
    return `<button class="${cls}" ${est} data-a="unidade" data-u="${u.id}" data-dica="${esc(dica)}">${rot}</button>`;
  };
  const linhas = [...S.pavs].sort((a, b) => b.n - a.n).map(p => {
    const info = R.pav[p.n], us = c.unidades.filter(u => u.pav === p.n), pc = info.tot ? info.feitos / info.tot * 100 : 0;
    const aptos = us.filter(u => u.tipo === 'apto'), hall = us.find(u => u.tipo === 'hall'), s = info.fimT ? c.cal.em(info.fimT) : null;
    const pv = info.feitos === info.tot ? `<span class="selo ok">✓ Liberado ${fCurta(s.d)}</span>` : info.incerto || !s ? '<span class="mudo">sem previsão</span>' : `libera <b>${fSem(s.d)}</b> · ${TURNO[s.t]}`;
    return `<div class="pav" id="pav-${p.n}"><div class="n">${p.n}º <small>pav</small></div>
      <div class="cels" style="grid-template-columns:repeat(${maxQ},minmax(0,1fr)) 6px minmax(0,1.5fr)">${aptos.map(cel).join('')}${'<span></span>'.repeat(maxQ - aptos.length + 1)}${cel(hall)}</div>
      <div class="pg"><div class="barra ${pc === 100 ? 'ok' : ''}"><i style="width:${pc}%"></i></div><span class="dir">${num(pc)}%</span></div>
      <div class="pv">${pv}</div></div>`;
  }).join('');
  // térreo: a recepção, uma unidade só
  const r = c.porId.get('R'), fr = c.feito.get('R'), pr = prev && prev.plano.get('R'), sr = fr ? fr : pr ? c.cal.em(pr.fim) : null;
  return linhas + `<div class="pav terreo"><div class="n">Térreo</div>
    <div class="cels" style="grid-template-columns:repeat(${maxQ},minmax(0,1fr)) 6px minmax(0,1.5fr)">${cel(r)}</div>
    <div class="pg"><div class="barra ${fr ? 'ok' : ''}"><i style="width:${fr ? 100 : 0}%"></i></div><span class="dir">${fr ? 100 : 0}%</span></div>
    <div class="pv">${fr ? `<span class="selo ok">✓ Concluída ${fCurta(fr.d)}</span>` : sr ? `previsão <b>${fSem(sr.d)}</b> · ${TURNO[sr.t]}` : '<span class="mudo">sem previsão</span>'}</div></div>`;
}

/** Equipes da mais rápida para a mais lenta (dias reais por apartamento). */
function ranking() {
  const { S, R } = app, { c } = R;
  const rk = S.equipes.filter(e => c.st[e.id].peso > 0).sort((a, b) => c.st[a.id].bruto - c.st[b.id].bruto);
  if (!rk.length) return '<p class="mudo">O ranking aparece quando a primeira unidade for concluída.</p>';
  const pior = Math.max(c.A, ...rk.map(e => c.st[e.id].bruto));
  return rk.map((e, k) => { const s = c.st[e.id]; return `<div class="l ${k === 0 ? 'um' : ''}"><div class="pos">${k === 0 ? '★' : k + 1}</div>
    <div><div class="nm"><i class="ponto" style="color:${cor(e)};background:${cor(e)}"></i>${esc(e.nome)}${e.ativa ? '' : ' <span class="selo nt">saiu</span>'}</div><div class="barra ${s.bruto <= c.A ? 'ok' : ''}"><i style="width:${s.bruto / pior * 100}%"></i></div></div>
    <div class="vl">${diasApto(s.bruto)} d/apto<small>${plural(s.aptos, 'apto', 'aptos')}${s.halls ? ' · ' + plural(s.halls, 'hall', 'halls') : ''}</small></div></div>`; }).join('');
}

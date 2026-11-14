import { app, eq } from '../nucleo/contexto.js';
import { fSem, TURNO } from '/compartilhado/datas.js';
import { $, $$, esc, cor } from './dom.js';
import { acoes } from './acoes.js';

/** Aviso que aparece no canto e some sozinho. */
export function toast(html, erro) {
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; if (erro) t.style.borderLeftColor = 'var(--alerta)';
  $('#toasts').appendChild(t); setTimeout(() => { t.classList.add('sai'); setTimeout(() => t.remove(), 300); }, 4200);
}
export function abrirJanela(html) { $('#flut').innerHTML = `<div class="veu" data-a="fechar-veu"><div class="janela" role="dialog" aria-modal="true">${html}</div></div>`; const f = $('#flut input, #flut button.pri'); if (f) f.focus(); }
export function fecharJanela() { $('#flut').innerHTML = ''; }
export function confirmar(titulo, texto, rotulo, fn, perigo) {
  abrirJanela(`<h3>${titulo}</h3><p class="mudo">${texto}</p><div class="rod"><button class="btn" data-a="fechar">Cancelar</button><button class="btn ${perigo ? 'perigo' : 'pri'}" id="conf-ok">${rotulo}</button></div>`);
  $('#conf-ok').onclick = fn;
}

/** Janela da unidade: concluir (equipe, data, manhã ou tarde), reservar para uma equipe ou desfazer. */
export function janelaUnidade(id, eqSug) {
  const { S, R } = app, { c, prev } = R, u = c.porId.get(id), f = c.feito.get(id), pl = prev && prev.plano.get(id), ag = c.ag;
  const sel = f ? f.e : eqSug || S.fixos[id] || (pl && eq(pl.eq) ? pl.eq : (c.ativos[0] || {}).id);
  const lista = S.equipes.filter(e => e.ativa || e.id === sel || c.st[e.id].peso);
  const sl = pl && c.cal.em(pl.fim);
  abrirJanela(`<h3>${u.tipo === 'hall' ? esc(u.nome) : 'Apto ' + esc(u.nome)} <small>${u.pav}º pavimento</small></h3>
    <div>${f ? `<span class="selo ok">✓ Concluído ${fSem(f.d)} · ${TURNO[f.t]}</span>` : R.emAnd.has(id) ? `<span class="selo mc">Em montagem · previsão ${fSem(sl.d)} ${TURNO[sl.t]}</span>` : sl ? `<span class="selo nt">Previsão ${fSem(sl.d)} · ${TURNO[sl.t]}</span>` : '<span class="selo nt">Sem previsão</span>'}</div>
    <div class="campo">Equipe que montou<div class="chips" id="ju-eq">${lista.map(e => `<button type="button" class="${e.id === sel ? 'on' : ''}" style="--c:${cor(e)}" data-e="${e.id}"><i class="ponto" style="color:${cor(e)};background:${cor(e)}"></i>${esc(e.nome)}${e.ativa ? '' : ' (saiu)'}</button>`).join('') || '<span class="mudo">Cadastre uma equipe primeiro.</span>'}</div></div>
    <div class="form"><label class="campo">Concluído em<input type="date" id="ju-data" value="${f ? f.d : ag.d}" max="${ag.d}"></label>
      <div class="campo">Turno<div class="seg" id="ju-turno"><button type="button" class="${(f ? f.t : ag.t) === 0 ? 'on' : ''}" data-t="0">Manhã</button><button type="button" class="${(f ? f.t : ag.t) === 1 ? 'on' : ''}" data-t="1">Tarde</button></div></div></div>
    <div class="rod">${f ? `<button class="btn perigo" id="ju-desf">Desfazer conclusão</button>` : `<button class="btn" id="ju-res">${S.fixos[id] ? 'Tirar reserva' : 'Só reservar para a equipe'}</button>`}<button class="btn" data-a="fechar">Cancelar</button><button class="btn pri" id="ju-ok" ${lista.length ? '' : 'disabled'}>${f ? 'Salvar' : 'Concluir'}</button></div>`);
  const troca = box => $(box).addEventListener('click', e => { const b = e.target.closest('button'); if (b) $$(box + ' button').forEach(x => x.classList.toggle('on', x === b)); });
  troca('#ju-eq'); troca('#ju-turno');
  const escolhida = () => $('#ju-eq .on')?.dataset.e;
  $('#ju-ok').onclick = () => { const d = $('#ju-data').value; if (!d || d > ag.d) return toast('Escolha uma data até hoje.', true); if (!escolhida()) return toast('Escolha a equipe.', true); acoes.concluir(id, d, +$('#ju-turno .on').dataset.t, escolhida()); };
  if (f) $('#ju-desf').onclick = () => acoes.desfazer(id); else $('#ju-res').onclick = () => acoes.reservar(id, S.fixos[id] ? null : escolhida());
}

export function janelaEquipe(id) {
  const e = eq(id);
  abrirJanela(`<h3>Editar equipe</h3><label class="campo">Nome<input id="ee-nome" value="${esc(e.nome)}" maxlength="40"></label>
    <div class="form"><label class="campo">Tipo<select id="ee-tipo"><option value="fixa" ${e.tipo === 'fixa' ? 'selected' : ''}>Fixa da loja</option><option value="terceirizada" ${e.tipo !== 'fixa' ? 'selected' : ''}>Terceirizada</option></select></label>
    <label class="campo">Começou em (vazio = início da obra)<input type="date" id="ee-entrada" value="${e.entrada || ''}"></label></div>
    <div class="rod"><button class="btn" data-a="fechar">Cancelar</button><button class="btn pri" id="ee-ok">Salvar</button></div>`);
  $('#ee-ok').onclick = () => acoes.editarEquipe(id, $('#ee-nome').value.trim(), $('#ee-tipo').value, $('#ee-entrada').value);
}

import { app } from '../../nucleo/contexto.js';
import { fData, fCurta, fSem, TURNO } from '/compartilhado/datas.js';
import { esc, cor } from '../dom.js';
import { diasApto } from '../formato.js';

/** Aba Equipes: cadastrar, editar, retirar e reativar; números de cada equipe. */
export function equipes() {
  const { S, R } = app, { c } = R, melhor = S.equipes.filter(e => c.st[e.id].peso > 0).sort((a, b) => c.st[a.id].bruto - c.st[b.id].bruto)[0];
  const cartao = e => {
    const s = c.st[e.id], at = e.ativa && R.atual[e.id], sl = at && c.cal.em(at.fim), ult = s.lista[s.lista.length - 1];
    return `<div class="card eq ${e.ativa ? '' : 'fora'}"><div class="cab"><i class="ponto" style="color:${cor(e)};background:${cor(e)};width:12px;height:12px"></i><b>${esc(e.nome)}</b>
      ${melhor === e ? '<span class="selo av">★ mais rápida</span>' : ''}<span class="selo ${e.tipo === 'fixa' ? 'mc' : 'nt'}">${e.tipo === 'fixa' ? 'fixa' : 'terceirizada'}</span></div>
      <div class="nums"><div><b>${s.aptos + s.halls}</b><span>${s.halls ? s.aptos + ' aptos · ' + s.halls + ' halls' : 'concluídas'}</span></div>
        <div><b>${s.bruto ? diasApto(s.bruto) : '—'}</b><span>dias/apto real</span></div>
        <div><b>${diasApto(S.cfg.base === 'plano' ? c.A : s.ritmo)}</b><span>dias/apto previsão</span></div></div>
      <div class="agora">${!e.ativa ? '<span class="mudo">Fora da obra. O histórico continua valendo nas médias.</span>' : at ? `<div><span class="mudo">${c.iniciou ? 'Agora em' : 'Começa por'}</span> <b>${esc(at.u.nome)}</b><br><span class="mudo">previsão ${fSem(sl.d)} · ${TURNO[sl.t]}</span></div><button class="btn pri mini" data-a="unidade" data-u="${at.u.id}" data-e="${e.id}">Concluir</button>` : '<span class="mudo">Sem unidade na fila.</span>'}</div>
      <div class="linha" style="justify-content:space-between"><span class="mudo" style="font-size:12px">${ult ? 'Última: ' + esc(ult.u.nome) + ' em ' + fCurta(c.feito.get(ult.u.id).d) : e.entrada ? 'Entra em ' + fData(e.entrada) : 'Desde o início da obra'}</span>
        <div class="rod"><button class="btn mini" data-a="editar-equipe" data-e="${e.id}">Editar</button>${e.ativa ? `<button class="btn mini perigo" data-a="retirar" data-e="${e.id}">Retirar</button>` : `<button class="btn mini" data-a="reativar" data-e="${e.id}">Reativar</button>`}</div></div></div>`;
  };
  return `<div class="grade entra">
    <div class="card"><div class="rot">Nova equipe</div><div class="nova"><label class="campo">Nome<input id="ne-nome" placeholder="Ex.: Terceirizada João" maxlength="40"></label>
      <label class="campo">Tipo<select id="ne-tipo"><option value="terceirizada">Terceirizada</option><option value="fixa">Fixa da loja</option></select></label>
      <label class="campo">Começa em<input type="date" id="ne-entrada" value="${R.prox}"></label><button class="btn pri" data-a="nova-equipe">Adicionar equipe</button></div>
      <p class="mudo" style="margin-top:12px">Ao adicionar ou retirar uma equipe o cronograma inteiro é refeito na hora. Equipe nova entra na previsão com o ritmo médio real da obra (${diasApto(c.ritmoGeral)} dias por apto) até ter as próprias conclusões.</p></div>
    <div class="grade eqs">${S.equipes.filter(e => e.ativa).map(cartao).join('')}${S.equipes.filter(e => !e.ativa).map(cartao).join('')}</div></div>`;
}

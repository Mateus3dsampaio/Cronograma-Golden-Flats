import { app } from '../../nucleo/contexto.js';
import { APTOS_CONTRATO } from '/compartilhado/estado-padrao.js';
import { DS, fSem } from '/compartilhado/datas.js';
import { esc } from '../dom.js';
import { modelosApto } from '/compartilhado/pagamentos.js';

const ROT = ['não trabalha', 'só manhã', 'dia inteiro'];

/** Aba Configurações: dados da obra, dias de trabalho, feriados, pavimentos e backup. */
export function configuracoes() {
  const { S, DEMO } = app, adm = app.usuario.admin, c = S.cfg, totA = S.pavs.reduce((s, p) => s + p.q, 0);
  return `<div class="grade cfg entra">
    <div class="grade">
      <div class="card"><div class="rot"><span>Obra</span>${S.conferido ? '' : '<button class="btn mini pri" data-a="conferido">Já conferi os dados</button>'}</div><div class="form">
        <label class="campo tudo">Nome da obra<input data-cfg="nome" value="${esc(c.nome)}" maxlength="40"></label>
        <label class="campo">Início da montagem<input type="date" data-cfg="inicio" value="${c.inicio}"></label>
        <label class="campo">Prazo combinado com o cliente<input type="date" data-cfg="prazo" value="${c.prazo}"></label>
        <div class="campo tudo">Ordem de montagem<div class="seg"><button class="${c.ordem === 'asc' ? 'on' : ''}" data-a="ordem" data-v="asc">De baixo para cima</button><button class="${c.ordem === 'desc' ? 'on' : ''}" data-a="ordem" data-v="desc">De cima para baixo</button></div></div>
        <div class="campo tudo">Base da previsão<div class="seg"><button class="${c.base === 'real' ? 'on' : ''}" data-a="base" data-v="real">Ritmo real das equipes</button><button class="${c.base === 'plano' ? 'on' : ''}" data-a="base" data-v="plano">Sempre o planejado</button></div></div></div></div>
      <div class="card"><div class="rot">Meta de montagem · dias de uma equipe por unidade</div>
        <div class="metas">${S.pag.itens.map(i => `<label class="campo">${esc(i.nome)}<input type="number" step="0.5" min="0.5" max="90" data-pg="dias" data-id="${i.id}" value="${i.dias}"></label>`).join('')}
          <label class="campo">Apartamento sem modelo marcado<input type="number" step="0.5" min="0.5" max="30" data-cfg="aptoDias" value="${c.aptoDias}"></label></div>
        <p class="mudo" style="margin-top:12px;font-size:12px">A meta é o ponto de partida da previsão. Conforme as conclusões são marcadas, a previsão passa a seguir o ritmo real de cada equipe: quem monta mais rápido que a meta adianta o término, quem demora mais atrasa. Aceita meio dia (ex.: 1,5). A recepção é uma unidade só e fica no fim da fila.</p></div>
      <div class="card"><div class="rot">Dias de trabalho · clique para alternar</div>
        <div class="dias">${c.semana.map((m, i) => `<button class="m${m}" data-a="dia" data-i="${i}">${DS[i].toUpperCase()}<small>${ROT[m]}</small></button>`).join('')}</div>
        <div class="rot" style="margin:18px 0 10px">Feriados e dias parados</div>
        <div class="linha"><label class="campo" style="width:180px"><input type="date" id="fer-data"></label><button class="btn" data-a="fer-add">Adicionar</button><button class="btn" data-a="fer-nac">+ Feriados nacionais 2026/2027</button></div>
        <div class="fer">${[...c.feriados].sort().map(f => `<span class="selo nt">${fSem(f)}/${f.slice(2, 4)}<button data-a="fer-del" data-d="${f}" aria-label="Remover">×</button></span>`).join('') || '<span class="mudo">Nenhum cadastrado.</span>'}</div></div>
    </div>
    <div class="grade">
      <div class="card"><div class="rot"><span>Apartamentos por pavimento</span><span class="selo ${totA === APTOS_CONTRATO ? 'ok' : 'av'}">${totA} aptos + ${S.pavs.length} halls + recepção${totA === APTOS_CONTRATO ? '' : ' · contrato: ' + APTOS_CONTRATO}</span></div>
        <div class="pavs-cfg">${S.pavs.map((p, i) => `<label>${p.n}º pavimento<input type="number" min="0" max="40" data-pav="${i}" value="${p.q}"></label>`).join('')}</div>
        <div class="linha" style="margin-top:14px"><button class="btn mini" data-a="pav-add">+ Pavimento</button><button class="btn mini" data-a="pav-del" ${S.pavs.length > 1 ? '' : 'disabled'}>Remover o último</button><span class="mudo" style="font-size:12px">Numeração: 3º pavimento = 301, 302… Cada pavimento tem 1 hall.</span></div></div>
      <div class="card"><div class="rot">Dados e backup</div>
        <p class="mudo" style="margin-bottom:14px">Os dados ficam no servidor e aparecem iguais no celular e no computador. O servidor guarda sozinho uma cópia por dia (últimos 30 dias). Baixar um backup de vez em quando continua sendo uma boa garantia extra.</p>
        <div class="linha"><button class="btn pri" data-a="backup">Baixar backup</button>${adm ? '<button class="btn" data-a="restaurar">Restaurar backup</button><input type="file" id="arq" accept=".json" hidden>' : ''}
          <button class="btn" data-a="demo">${DEMO ? 'Sair do exemplo' : 'Ver com dados de exemplo'}</button>${adm ? '<button class="btn perigo" data-a="zerar">Zerar tudo</button>' : ''}</div></div>
      ${adm && !DEMO ? usuarios() : ''}
    </div>
    ${modelos()}</div>`;
}

/** Mapa para marcar o modelo de cada apartamento: escolhe o modelo e clica nos apartamentos. */
function modelos() {
  const { S } = app, mods = modelosApto(S), m = S.pag.modelos, conta = {}, maxQ = Math.max(1, ...S.pavs.map(p => p.q));
  for (const p of S.pavs) for (let k = 1; k <= p.q; k++) { const id = m[p.n + '-' + k]; if (id) conta[id] = (conta[id] || 0) + 1; }
  const falta = S.pavs.reduce((s, p) => s + p.q, 0) - Object.values(conta).reduce((s, n) => s + n, 0);
  return `<div class="card mods"><div class="rot"><span>Modelo de cada apartamento · escolha o modelo e clique nos apartamentos</span><span class="selo ${falta ? 'av' : 'ok'}">${falta ? falta + ' sem modelo' : 'todos marcados'}</span></div>
    <div class="mod-pinceis">${mods.map((x, i) => `<button class="mod-p m${i + 1} ${app.pincel === x.id ? 'on' : ''}" data-a="pincel" data-v="${x.id}"><i></i><span><b>${esc(x.nome)}</b><small class="${(conta[x.id] || 0) === x.qtd ? 'certo' : ''}">${conta[x.id] || 0} de ${x.qtd} do contrato</small></span></button>`).join('')}
      <button class="mod-p m0 ${app.pincel ? '' : 'on'}" data-a="pincel" data-v=""><i></i><span><b>Apagar</b><small>tira o modelo</small></span></button></div>
    <div class="mod-mapa">${[...S.pavs].sort((a, b) => b.n - a.n).map(p => `<div class="mod-pav"><div class="n">${p.n}º <small>pav</small></div>
      <div class="cels" style="grid-template-columns:repeat(${maxQ},minmax(0,1fr))">${Array.from({ length: p.q }, (_, i) => { const id = p.n + '-' + (i + 1), k = mods.findIndex(x => x.id === m[id]); return `<button class="cel mod m${k + 1}" data-a="modelo" data-u="${id}" data-dica="${p.n}${String(i + 1).padStart(2, '0')} · ${k < 0 ? 'sem modelo' : esc(mods[k].nome)}">${p.n}${String(i + 1).padStart(2, '0')}</button>`; }).join('')}</div>
      <div class="rod"><button class="btn mini" data-a="modelo-pav" data-andar="${p.n}" data-dica="Marca o pavimento inteiro com o modelo escolhido">Pavimento todo</button><button class="btn mini" data-a="modelo-copiar" data-andar="${p.n}" data-dica="Copia a sequência deste pavimento para todos os outros">Repetir nos outros</button></div></div>`).join('')}</div>
    <p class="mudo" style="margin-top:12px;font-size:12px">O modelo define o valor da unidade na aba Pagamentos. Se os pavimentos repetem a mesma sequência, marque um e use "Repetir nos outros". Clicar de novo num apartamento com o mesmo modelo tira a marcação.</p></div>`;
}

/** Cartão de usuários (só o administrador vê). */
function usuarios() {
  const lista = app.usuarios;
  return `<div class="card"><div class="rot">Usuários · cada pessoa entra com o próprio nome e senha</div>
    <div class="usuarios">${!lista ? '<span class="mudo">Carregando…</span>' : lista.map(u => `<div class="usuario"><b>${esc(u.nome)}</b>${u.admin ? '<span class="selo mc">administrador</span><span class="mudo" style="font-size:12px">senha na variável SENHA do Railway</span>' : `<span class="selo nt">usuário</span><span class="rod"><button class="btn mini" data-a="usuario-senha" data-nome="${esc(u.nome)}">Trocar senha</button><button class="btn mini perigo" data-a="usuario-remover" data-nome="${esc(u.nome)}">Remover</button></span>`}</div>`).join('')}</div>
    <div class="nova" style="grid-template-columns:1fr 1fr auto;margin-top:14px"><label class="campo">Nome<input id="nu-nome" maxlength="30" autocomplete="off"></label><label class="campo">Senha (mínimo 6)<input id="nu-senha" type="password" autocomplete="new-password"></label><button class="btn pri" data-a="usuario-novo">Adicionar usuário</button></div>
    <p class="mudo" style="margin-top:12px;font-size:12px">Usuários marcam conclusões, cuidam das equipes e mudam configurações. Só o administrador cria usuários, restaura backup, zera a obra e troca o link do cliente. Tudo o que cada um faz fica na aba Atividades.</p></div>`;
}

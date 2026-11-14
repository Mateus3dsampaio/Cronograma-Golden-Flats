import { app } from '../../nucleo/contexto.js';
import { APTOS_CONTRATO } from '/compartilhado/estado-padrao.js';
import { DS, fSem } from '/compartilhado/datas.js';
import { esc } from '../dom.js';

const ROT = ['não trabalha', 'só manhã', 'dia inteiro'];

/** Aba Configurações: dados da obra, dias de trabalho, feriados, pavimentos e backup. */
export function configuracoes() {
  const { S, DEMO } = app, c = S.cfg, totA = S.pavs.reduce((s, p) => s + p.q, 0);
  return `<div class="grade cfg entra">
    <div class="grade">
      <div class="card"><div class="rot"><span>Obra</span>${S.conferido ? '' : '<button class="btn mini pri" data-a="conferido">Já conferi os dados</button>'}</div><div class="form">
        <label class="campo tudo">Nome da obra<input data-cfg="nome" value="${esc(c.nome)}" maxlength="40"></label>
        <label class="campo">Início da montagem<input type="date" data-cfg="inicio" value="${c.inicio}"></label>
        <label class="campo">Prazo combinado com o cliente<input type="date" data-cfg="prazo" value="${c.prazo}"></label>
        <label class="campo">Dias por apartamento (1 equipe)<input type="number" step="0.5" min="0.5" max="30" data-cfg="aptoDias" value="${c.aptoDias}"></label>
        <label class="campo">Dias por hall (provisório)<input type="number" step="0.5" min="0.5" max="30" data-cfg="hallDias" value="${c.hallDias}"></label>
        <div class="campo tudo">Ordem de montagem<div class="seg"><button class="${c.ordem === 'asc' ? 'on' : ''}" data-a="ordem" data-v="asc">De baixo para cima</button><button class="${c.ordem === 'desc' ? 'on' : ''}" data-a="ordem" data-v="desc">De cima para baixo</button></div></div>
        <div class="campo tudo">Base da previsão<div class="seg"><button class="${c.base === 'real' ? 'on' : ''}" data-a="base" data-v="real">Ritmo real das equipes</button><button class="${c.base === 'plano' ? 'on' : ''}" data-a="base" data-v="plano">Sempre o planejado</button></div></div></div></div>
      <div class="card"><div class="rot">Dias de trabalho · clique para alternar</div>
        <div class="dias">${c.semana.map((m, i) => `<button class="m${m}" data-a="dia" data-i="${i}">${DS[i].toUpperCase()}<small>${ROT[m]}</small></button>`).join('')}</div>
        <div class="rot" style="margin:18px 0 10px">Feriados e dias parados</div>
        <div class="linha"><label class="campo" style="width:180px"><input type="date" id="fer-data"></label><button class="btn" data-a="fer-add">Adicionar</button><button class="btn" data-a="fer-nac">+ Feriados nacionais 2026/2027</button></div>
        <div class="fer">${[...c.feriados].sort().map(f => `<span class="selo nt">${fSem(f)}/${f.slice(2, 4)}<button data-a="fer-del" data-d="${f}" aria-label="Remover">×</button></span>`).join('') || '<span class="mudo">Nenhum cadastrado.</span>'}</div></div>
    </div>
    <div class="grade">
      <div class="card"><div class="rot"><span>Apartamentos por pavimento</span><span class="selo ${totA === APTOS_CONTRATO ? 'ok' : 'av'}">${totA} aptos + ${S.pavs.length} halls${totA === APTOS_CONTRATO ? '' : ' · contrato: ' + APTOS_CONTRATO}</span></div>
        <div class="pavs-cfg">${S.pavs.map((p, i) => `<label>${p.n}º pavimento<input type="number" min="0" max="40" data-pav="${i}" value="${p.q}"></label>`).join('')}</div>
        <div class="linha" style="margin-top:14px"><button class="btn mini" data-a="pav-add">+ Pavimento</button><button class="btn mini" data-a="pav-del" ${S.pavs.length > 1 ? '' : 'disabled'}>Remover o último</button><span class="mudo" style="font-size:12px">Numeração: 3º pavimento = 301, 302… Cada pavimento tem 1 hall.</span></div></div>
      <div class="card"><div class="rot">Dados e backup</div>
        <p class="mudo" style="margin-bottom:14px">Os dados ficam no servidor e aparecem iguais no celular e no computador. O servidor guarda sozinho uma cópia por dia (últimos 30 dias). Baixar um backup de vez em quando continua sendo uma boa garantia extra.</p>
        <div class="linha"><button class="btn pri" data-a="backup">Baixar backup</button><button class="btn" data-a="restaurar">Restaurar backup</button><input type="file" id="arq" accept=".json" hidden>
          <button class="btn" data-a="demo">${DEMO ? 'Sair do exemplo' : 'Ver com dados de exemplo'}</button><button class="btn perigo" data-a="zerar">Zerar tudo</button></div></div>
    </div></div>`;
}

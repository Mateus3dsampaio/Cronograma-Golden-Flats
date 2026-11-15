import { app } from '../../nucleo/contexto.js';
import { linhasCliente, fimCliente } from '/compartilhado/cliente.js';
import { fData, plural } from '/compartilhado/datas.js';
import { esc } from '../dom.js';
import { tabelaCliente } from '../tabela-cliente.js';

/** Aba Cliente: previsão de liberação por pavimento, link só de leitura, impressão e texto para WhatsApp. */
export function cliente() {
  const { S, R, DEMO } = app, { c } = R, mg = S.cfg.margemCliente || 0, fim = fimCliente(S, R);
  const link = location.origin + '/c/' + app.tokenCliente;
  return `<div class="grade entra"><div class="card">
    <div class="cli-cab"><div><div class="rot">Previsão de liberação dos pavimentos</div><h2>${esc(S.cfg.nome)}</h2><p class="mudo">Atualizado em ${fData(c.ag.d)} · ${R.liberados} de ${S.pavs.length} pavimentos liberados · conclusão total prevista para <b style="color:inherit">${fim ? fData(fim.d) : '—'}</b></p></div>
      <div class="linha nao-imp"><label class="campo" style="width:190px">Margem de segurança (dias úteis)<input type="number" min="0" max="30" data-cfg="margemCliente" value="${mg}"></label>
        <button class="btn" data-a="copiar-cliente">Copiar texto p/ WhatsApp</button><button class="btn pri" data-a="imprimir">Imprimir / PDF</button></div></div>
    ${tabelaCliente(linhasCliente(S, R))}
    <p class="mudo" style="margin-top:14px;font-size:12px">Datas previstas com base no andamento real da montagem; podem ser ajustadas conforme a obra avança.${mg ? ` <span class="nao-imp">(Inclui ${plural(mg, 'dia útil', 'dias úteis')} de margem sobre a previsão interna.)</span>` : ' <span class="nao-imp">(Sem margem: são as mesmas datas da previsão interna. Recomendo passar ao cliente com alguns dias de folga.)</span>'}</p></div>
    ${DEMO ? '' : `<div class="card nao-imp"><div class="rot">Link do cliente · só leitura, sem senha</div>
      <p class="mudo" style="margin-bottom:12px">Quem abrir este link vê apenas esta tabela, sempre atualizada, já com a margem de segurança. Não vê equipes, ritmo nem o restante do sistema. "Gerar novo link" faz o link antigo parar de funcionar.</p>
      <div class="linha"><label class="campo" style="flex:1;min-width:260px"><input readonly id="link-cliente" value="${esc(link)}"></label><button class="btn pri" data-a="copiar-link">Copiar link</button>${app.usuario.admin ? '<button class="btn" data-a="novo-link">Gerar novo link</button>' : ''}</div></div>`}
  </div>`;
}

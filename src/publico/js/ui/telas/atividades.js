import { app } from '../../nucleo/contexto.js';
import { esc } from '../dom.js';
import { fQuando } from '../formato.js';

const SELO = { concluiu: ['ok', 'Conclusão'], desfez: ['al', 'Desfeita'], corrigiu: ['av', 'Correção'], massa: ['al', 'Em massa'], reserva: ['mc', 'Reserva'], equipe: ['mc', 'Equipe'], config: ['nt', 'Configuração'], usuario: ['nt', 'Usuário'] };

/** Aba Atividades: quem fez o quê e quando (horário de Fortaleza). O registro é feito pelo servidor. */
export function atividades() {
  const { DEMO } = app, lista = app.atividades;
  if (DEMO) return `<div class="card entra"><p class="mudo">O modo exemplo não tem registro de atividades.</p></div>`;
  if (!lista) return `<div class="card entra"><p class="mudo">Carregando atividades…</p></div>`;
  const pessoas = [...new Set(lista.map(a => a.por))].sort(), f = app.filtroAtiv, vis = f ? lista.filter(a => a.por === f) : lista;
  const conta = p => lista.filter(a => a.por === p && a.tipo === 'concluiu').length;
  return `<div class="grade entra"><div class="card">
    <div class="rot"><span>Registro de atividades · horário de Fortaleza</span><span class="mudo" style="letter-spacing:0;text-transform:none;font-weight:500">${vis.length} ${vis.length === 1 ? 'registro' : 'registros'}${lista.length >= 500 ? ' (últimos 500)' : ''}</span></div>
    <div class="chips" style="margin-bottom:14px"><button class="${f ? '' : 'on'}" style="--c:var(--marca-txt)" data-a="filtro-ativ" data-v="">Todos</button>${pessoas.map(p => `<button class="${f === p ? 'on' : ''}" style="--c:var(--marca-txt)" data-a="filtro-ativ" data-v="${esc(p)}">${esc(p)} · ${conta(p)} ${conta(p) === 1 ? 'conclusão' : 'conclusões'}</button>`).join('')}</div>
    ${vis.length ? `<div style="overflow-x:auto"><table class="tab"><thead><tr><th style="width:190px">Quando</th><th style="width:150px">Quem</th><th style="width:130px">Tipo</th><th>O que fez</th></tr></thead><tbody>
      ${vis.map(a => { const s = SELO[a.tipo] || ['nt', a.tipo]; return `<tr><td class="mudo" style="white-space:nowrap">${fQuando(a.em)}</td><td><b>${esc(a.por)}</b></td><td><span class="selo ${s[0]}">${s[1]}</span></td><td>${esc(a.texto)}</td></tr>`; }).join('')}
    </tbody></table></div>` : '<p class="mudo">Nenhuma atividade registrada ainda. O registro começa a partir de agora.</p>'}
  </div></div>`;
}

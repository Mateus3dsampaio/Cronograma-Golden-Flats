import { app, agora } from '../nucleo/contexto.js';
import { calcular } from '/compartilhado/previsao.js';
import { fSem, num } from '/compartilhado/datas.js';
import { $, $$, semMovimento } from './dom.js';
import { Esfera } from './esfera.js';
import { grafico } from './grafico.js';
import { acompanhamento } from './telas/acompanhamento.js';
import { cronograma } from './telas/cronograma.js';
import { equipes } from './telas/equipes.js';
import { simulador } from './telas/simulador.js';
import { cliente } from './telas/cliente.js';
import { configuracoes } from './telas/configuracoes.js';
import { atividades } from './telas/atividades.js';

const telas = { acomp: acompanhamento, crono: cronograma, equipes, simul: simulador, cliente, ativ: atividades, config: configuracoes };

/** Refaz as contas e redesenha a aba aberta. `animar` = entrada com animação (troca de aba). */
export function desenhar(animar) {
  const { S } = app; app.R = calcular(S, agora()); const R = app.R;
  const tela = $('#tela'), rolagem = scrollY, gs = $('#gantt') ? $('#gantt').scrollLeft : null;
  tela.innerHTML = telas[app.aba]();
  if (!animar) $$('.entra', tela).forEach(e => e.classList.remove('entra'));
  if (app.aba === 'acomp') {
    const l = $('#lugar-esfera'); l.appendChild(Esfera.cv);
    Esfera.definir([...R.c.unidades].sort((a, b) => a.pav - b.pav).map(u => R.c.feito.has(u.id) ? 2 : R.emAnd.has(u.id) ? 1 : 0));
    const g = $('#grafico'); g.innerHTML = grafico(g.clientWidth || 800, 280);
  }
  if (app.aba === 'crono') { const g = $('#gantt'); if (g) g.scrollLeft = gs != null && !animar ? gs : Math.max(0, $('#g-hoje').offsetLeft - 420); }
  if (animar) $$('[data-n]', tela).forEach(contar); else scrollTo(0, rolagem);
  $('#nome-obra').textContent = S.cfg.nome.toUpperCase(); document.title = S.cfg.nome + ' · Cronograma de montagem';
  $('#usuario-txt').textContent = app.usuario.nome;
  $('#hoje-txt').textContent = fSem(R.c.ag.d) + '/' + R.c.ag.d.slice(0, 4);
  if (app.DEMO) $('#salvo').textContent = 'Modo exemplo (não grava)';
  $('#demo-faixa').innerHTML = app.DEMO ? '<div class="demo-faixa">MODO EXEMPLO · dados fictícios para você ver como fica. Nada aqui é gravado.<button data-a="demo">Sair do exemplo</button></div>' : '';
  $$('#abas button').forEach(b => b.classList.toggle('on', b.dataset.aba === app.aba));
  const on = $('#abas button.on'), ind = $('#abas i'); ind.style.left = on.offsetLeft + 'px'; ind.style.width = on.offsetWidth + 'px';
}

/** Número que sobe de zero até o valor (elementos com data-n). */
function contar(el) {
  if (semMovimento()) return;
  const fim = +el.dataset.n, dec = +(el.dataset.dec || 0), t0 = performance.now();
  const passo = t => { const k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 4); el.textContent = num(fim * e, dec); if (k < 1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
}

/** Luzinha do topo: salvando, salvo ou sem conexão. */
export function mostrarStatus(tipo) {
  const el = $('#salvo'); if (app.DEMO) return;
  el.className = 'salvo ' + tipo;
  el.textContent = { salvando: 'Salvando…', salvo: 'Salvo', erro: 'Sem conexão · tentando de novo' }[tipo];
  if (tipo === 'salvo') { void el.offsetWidth; el.classList.add('pisca'); }
}

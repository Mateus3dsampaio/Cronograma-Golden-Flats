import { app, agora, eq } from '../nucleo/contexto.js';
import { carregar, novoLinkCliente, sair, carregarAtividades, carregarUsuarios, salvarUsuario, removerUsuario } from '../nucleo/api.js';
import { estadoPadrao, estadoValido } from '/compartilhado/estado-padrao.js';
import { garantirPagamentos } from '/compartilhado/pagamentos.js';
import { estadoExemplo } from '/compartilhado/exemplo.js';
import { textoCliente } from '/compartilhado/cliente.js';
import { $, esc } from './dom.js';
import { desenhar } from './desenhar.js';
import { acoes, aplicar } from './acoes.js';
import { toast, fecharJanela, confirmar, abrirJanela, janelaUnidade, janelaEquipe } from './janelas.js';

// Feriados nacionais fixos + Sexta-feira Santa. Carnaval, Corpus Christi e feriados locais o Mateus adiciona à mão.
const FERIADOS_NACIONAIS = ['2026-11-20', '2026-12-25', '2027-01-01', '2027-03-26', '2027-04-21', '2027-05-01', '2027-09-07', '2027-10-12', '2027-11-02', '2027-11-15', '2027-11-20', '2027-12-25'];
const copiar = (txt, ok) => navigator.clipboard.writeText(txt).then(() => toast(ok), () => toast('Não consegui copiar neste navegador.', true));

/** Abas que mostram dados buscados na hora: busca e redesenha quando chegar. */
export function buscarDadosDaAba() {
  if (app.DEMO) return;
  if (app.aba === 'ativ') carregarAtividades().then(() => app.aba === 'ativ' && desenhar(false));
  if (app.aba === 'config' && app.usuario.admin && !app.usuarios) carregarUsuarios().then(() => app.aba === 'config' && desenhar(false));
}
const resultadoUsuario = (erro, ok) => { if (erro) return toast(erro, true); fecharJanela(); desenhar(false); toast(ok); };

/** Cada botão da tela tem data-a="nome da ação"; aqui está o que cada um faz. */
const cliques = {
  'fechar-veu': (d, ev, b) => { if (ev.target === b) fecharJanela(); },
  fechar: () => fecharJanela(),
  unidade: d => janelaUnidade(d.u, d.e),
  ir: d => { app.aba = d.aba; app.extrato = null; scrollTo(0, 0); desenhar(true); buscarDadosDaAba(); },
  'filtro-ativ': d => { app.filtroAtiv = d.v; desenhar(false); },
  // usuários (só o administrador)
  'usuario-novo': async () => { const n = $('#nu-nome').value.trim(); resultadoUsuario(await salvarUsuario(n, $('#nu-senha').value), `Usuário <b>${esc(n)}</b> criado. Passe o nome e a senha para a pessoa.`); },
  'usuario-senha': d => { abrirJanela(`<h3>Trocar senha de ${esc(d.nome)}</h3><label class="campo">Nova senha (mínimo 6)<input type="password" id="ts-senha" autocomplete="new-password"></label><p class="mudo">Os aparelhos em que ${esc(d.nome)} está conectada vão pedir a senha nova.</p><div class="rod"><button class="btn" data-a="fechar">Cancelar</button><button class="btn pri" id="ts-ok">Trocar senha</button></div>`); $('#ts-ok').onclick = async () => resultadoUsuario(await salvarUsuario(d.nome, $('#ts-senha').value), `Senha de <b>${esc(d.nome)}</b> trocada.`); },
  'usuario-remover': d => confirmar('Remover ' + esc(d.nome) + '?', 'A pessoa perde o acesso na hora. O que ela já marcou continua registrado no nome dela.', 'Remover usuário', async () => resultadoUsuario(await removerUsuario(d.nome), `Usuário <b>${esc(d.nome)}</b> removido.`), true),
  'gantt-hoje': () => $('#gantt').scrollTo({ left: Math.max(0, $('#g-hoje').offsetLeft - 420), behavior: 'smooth' }),
  sair: () => sair(),
  // equipes
  'nova-equipe': () => { const n = $('#ne-nome').value.trim(); if (!n) { toast('Dê um nome para a equipe.', true); return $('#ne-nome').focus(); } acoes.novaEquipe(n, $('#ne-tipo').value, $('#ne-entrada').value); },
  'editar-equipe': d => janelaEquipe(d.e),
  retirar: d => confirmar('Retirar ' + esc(eq(d.e).nome) + '?', 'O cronograma é refeito com as equipes que ficam. O que ela já concluiu continua registrado e ela pode ser reativada depois.', 'Retirar da obra', () => acoes.retirar(d.e), true),
  reativar: d => acoes.reativar(d.e),
  // configurações
  base: d => { app.S.cfg.base = d.v; aplicar(); },
  ordem: d => { app.S.cfg.ordem = d.v; aplicar(); },
  dia: d => { const s = app.S.cfg.semana; s[+d.i] = (s[+d.i] + 1) % 3; aplicar(); },
  conferido: () => { app.S.conferido = true; aplicar(() => 'Dados da obra conferidos.'); },
  'fer-add': () => { const v = $('#fer-data').value, f = app.S.cfg.feriados; if (v && !f.includes(v)) { f.push(v); aplicar(); } },
  'fer-del': d => { app.S.cfg.feriados = app.S.cfg.feriados.filter(x => x !== d.d); aplicar(); },
  'fer-nac': () => { const f = app.S.cfg.feriados; for (const x of FERIADOS_NACIONAIS) if (!f.includes(x)) f.push(x); aplicar(() => 'Feriados nacionais adicionados. Carnaval, Corpus Christi e feriados locais você adiciona à mão.'); },
  'pav-add': () => { const p = app.S.pavs; p.push({ n: Math.max(0, ...p.map(x => x.n)) + 1, q: p[p.length - 1]?.q || 14 }); aplicar(); },
  'pav-del': () => { const S = app.S, p = S.pavs[S.pavs.length - 1]; if (Object.keys(S.feitos).some(k => k.startsWith(p.n + '-'))) return toast('Esse pavimento já tem unidade concluída. Desfaça as conclusões antes.', true); S.pavs.pop(); aplicar(); },
  backup: () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(app.S, null, 1)], { type: 'application/json' })); a.download = `backup-golden-flats-${agora().d}.json`; a.click(); toast('Backup baixado. Guarde o arquivo em lugar seguro.'); },
  restaurar: () => $('#arq').click(),
  zerar: () => confirmar('Zerar tudo?', 'Apaga todas as conclusões, equipes e configurações, em todos os aparelhos. Baixe um backup antes.', 'Apagar tudo', () => { app.S = estadoPadrao(agora().d); fecharJanela(); aplicar(() => 'Tudo zerado.'); }, true),
  demo: async () => { app.DEMO = !app.DEMO; if (app.DEMO) { app.S = estadoExemplo(agora()); app.aba = 'acomp'; } else await carregar(); app.sim.alvo = app.sim.entrada = ''; app.extrato = null; desenhar(true); if (!app.DEMO) $('#salvo').textContent = 'Salvo'; },
  // pagamentos
  'pg-modo': d => { eq(d.e).pag.modo = d.v; aplicar(); },
  'pg-extrato': d => { app.extrato = { e: d.e, mes: d.mes }; scrollTo(0, 0); desenhar(true); },
  'pg-voltar': () => { app.extrato = null; desenhar(true); },
  'pg-imprimir': () => { const t = document.title, x = app.extrato; document.title = `Extrato ${eq(x.e).nome} ${x.mes || 'completo'}`; print(); document.title = t; }, // o nome do PDF sai do título
  // modelo de cada apartamento (Configurações)
  pincel: d => { app.pincel = d.v; desenhar(false); },
  modelo: d => { const m = app.S.pag.modelos; if (!app.pincel || m[d.u] === app.pincel) delete m[d.u]; else m[d.u] = app.pincel; aplicar(); },
  'modelo-pav': d => { const m = app.S.pag.modelos, p = app.S.pavs.find(x => x.n === +d.andar); for (let k = 1; k <= p.q; k++) { if (app.pincel) m[p.n + '-' + k] = app.pincel; else delete m[p.n + '-' + k]; } aplicar(); },
  'modelo-copiar': d => confirmar(`Repetir o ${d.andar}º pavimento em todos?`, 'Cada pavimento passa a ter os mesmos modelos, na mesma posição (final 01, 02…). O que já estava marcado nos outros pavimentos é substituído.', 'Repetir em todos', () => {
    const m = app.S.pag.modelos; for (const p of app.S.pavs) if (p.n !== +d.andar) for (let k = 1; k <= p.q; k++) { const o = m[d.andar + '-' + k]; if (o) m[p.n + '-' + k] = o; else delete m[p.n + '-' + k]; }
    fecharJanela(); aplicar(() => 'Modelos repetidos em todos os pavimentos. Confira os totais de cada modelo.');
  }),
  // cliente
  imprimir: () => print(),
  'copiar-cliente': () => copiar(textoCliente(app.S, app.R), 'Texto copiado. Confira antes de enviar ao cliente.'),
  'copiar-link': () => copiar($('#link-cliente').value, 'Link do cliente copiado.'),
  'novo-link': () => confirmar('Gerar novo link?', 'O link atual para de funcionar na hora. Quem tiver o link antigo não consegue mais abrir.', 'Gerar novo link', async () => { fecharJanela(); try { await novoLinkCliente(); desenhar(false); toast('Novo link gerado. Envie o novo ao cliente.'); } catch { toast('Não consegui gerar o link. Tente de novo.', true); } }),
};

/** Campos que gravam ao mudar (data-cfg, data-pav, data-sim) e o arquivo de backup. */
function aoMudar(ev) {
  const t = ev.target, S = app.S;
  if (t.dataset.cfg) {
    const k = t.dataset.cfg; let v = t.value;
    if (t.type === 'number') v = Math.max(+t.min || 0, Math.min(+t.max || 99, +v || 0));
    if (k === 'inicio' && !v) return desenhar(false);
    if (k === 'nome' && !v.trim()) v = 'Golden Flats';
    S.cfg[k] = v; aplicar();
  } else if (t.dataset.pav != null) {
    const p = S.pavs[+t.dataset.pav], q = Math.max(0, Math.min(40, Math.round(+t.value || 0)));
    const maior = Math.max(0, ...Object.keys(S.feitos).filter(k => k.startsWith(p.n + '-') && !k.endsWith('H')).map(k => +k.split('-')[1]));
    if (q < maior) { toast(`O ${p.n}º pavimento já tem o apto ${p.n}${String(maior).padStart(2, '0')} concluído.`, true); return desenhar(false); }
    p.q = q; aplicar();
  } else if (t.dataset.pg) {
    const k = t.dataset.pg, v = t.value === '' ? null : Math.max(0, +t.value || 0);
    if (k === 'ext-eq' || k === 'ext-mes') { app.extrato[k === 'ext-eq' ? 'e' : 'mes'] = t.value; return desenhar(false); }
    if (k === 'dias') { if (!(v > 0)) return desenhar(false); S.pag.itens.find(i => i.id === t.dataset.id).dias = Math.min(90, Math.max(.5, Math.round(v * 2) / 2)); }
    else if (k === 'valor') { if (v == null) return desenhar(false); S.pag.itens.find(i => i.id === t.dataset.id).valor = Math.round(v * 100) / 100; }
    else if (k === 'pct') eq(t.dataset.e).pag.pct = v == null ? null : Math.min(100, v);
    else eq(t.dataset.e).pag.fixo[k] = v == null ? null : Math.round(v * 100) / 100;
    aplicar();
  } else if (t.dataset.sim) { app.sim[t.dataset.sim] = t.value; desenhar(false); }
  else if (t.id === 'arq' && t.files[0]) {
    t.files[0].text().then(txt => {
      const n = JSON.parse(txt); if (!estadoValido(n)) throw new Error();
      confirmar('Restaurar este backup?', `O backup tem ${Object.keys(n.feitos).length} unidades concluídas e ${n.equipes.length} equipes. Ele substitui tudo o que está gravado hoje.`, 'Restaurar', () => { app.DEMO = false; app.S = garantirPagamentos(n); fecharJanela(); aplicar(() => 'Backup restaurado.'); });
    }).catch(() => toast('Esse arquivo não é um backup válido.', true));
  }
}

export function ligarEventos() {
  document.addEventListener('click', ev => {
    const ab = ev.target.closest('[data-aba]');
    if (ab && !ab.dataset.a) { app.aba = ab.dataset.aba; app.extrato = null; scrollTo(0, 0); desenhar(true); return buscarDadosDaAba(); }
    const b = ev.target.closest('[data-a]'); if (b && cliques[b.dataset.a]) cliques[b.dataset.a](b.dataset, ev, b);
  });
  document.addEventListener('change', aoMudar);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharJanela(); });
  // dica ao passar o mouse (data-dica)
  const dica = $('#dica');
  document.addEventListener('pointerover', e => {
    const el = e.target.closest('[data-dica]'); if (!el) return dica.classList.remove('on');
    dica.textContent = el.dataset.dica; const r = el.getBoundingClientRect(); dica.classList.add('on');
    const w = dica.offsetWidth, h = dica.offsetHeight;
    dica.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px'; dica.style.top = (r.top - h - 8 < 70 ? r.bottom + 8 : r.top - h - 8) + 'px';
  });
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => desenhar(false), 150); });
}

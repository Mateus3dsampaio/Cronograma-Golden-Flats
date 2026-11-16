import { app, agora, eq } from '../nucleo/contexto.js';
import { salvar } from '../nucleo/api.js';
import { dn, fData, fCurta, plural, TURNO } from '/compartilhado/datas.js';
import { $, esc, CORES } from './dom.js';
import { pagEquipePadrao } from '/compartilhado/pagamentos.js';
import { desenhar } from './desenhar.js';
import { toast, fecharJanela } from './janelas.js';

/**
 * Depois de qualquer mudança: grava, redesenha e avisa (com quantos dias a previsão de término mudou).
 * msgFn devolve o texto do aviso; popId = unidade que "pula" na tela.
 */
export function aplicar(msgFn, popId) {
  const antes = app.R && app.R.fim ? app.R.fim.d : null;
  salvar(); desenhar(false);
  const R = app.R;
  if (popId) { const el = $(`[data-u="${popId}"]`); if (el) el.classList.add('pop'); }
  if (msgFn) {
    let m = msgFn();
    if (antes && R.fim && R.fim.d !== antes) { const d = dn(R.fim.d) - dn(antes); m += `<br><span class="mudo">Previsão de término: ${fData(R.fim.d)} (${d > 0 ? '+' : ''}${plural(d, 'dia', 'dias')})</span>`; }
    toast(m);
  }
}
const nomeUn = id => esc(app.R.c.porId.get(id).nome);

/** Tudo o que muda a obra passa por aqui. Em concluir, "por" e "em" são só para a tela mostrar na hora: quem vale é o servidor. */
export const acoes = {
  concluir(id, d, t, e) { const S = app.S; S.feitos[id] = { d, t, e, por: app.usuario.nome, em: new Date().toISOString() }; delete S.fixos[id]; fecharJanela(); aplicar(() => `<b>${nomeUn(id)}</b> concluído · ${fCurta(d)} ${TURNO[t]}`, id); },
  desfazer(id) { delete app.S.feitos[id]; fecharJanela(); aplicar(() => `Conclusão de <b>${nomeUn(id)}</b> desfeita`); },
  reservar(id, e) { if (e) app.S.fixos[id] = e; else delete app.S.fixos[id]; fecharJanela(); aplicar(() => e ? `<b>${nomeUn(id)}</b> reservado para ${esc(eq(e).nome)}` : 'Reserva retirada'); },
  novaEquipe(nome, tipo, entrada) {
    const S = app.S, usadas = new Set(S.equipes.map(e => e.cor)); let c = 0; while (usadas.has(c) && c < CORES.length) c++;
    S.equipes.push({ id: 'e' + (S.seq++), nome, tipo, cor: c % CORES.length, ativa: true, entrada, pausas: [], pag: pagEquipePadrao(tipo) });
    aplicar(() => `Equipe <b>${esc(nome)}</b> entrou na obra. Cronograma reorganizado.`);
  },
  retirar(id) {
    const S = app.S, e = eq(id), temHist = Object.values(S.feitos).some(f => f.e === id);
    for (const u in S.fixos) if (S.fixos[u] === id) delete S.fixos[u];
    if (temHist) { e.ativa = false; (e.pausas = e.pausas || []).push({ de: agora().d, ate: null }); } // guarda o histórico
    else S.equipes = S.equipes.filter(x => x.id !== id);
    fecharJanela(); aplicar(() => `<b>${esc(e.nome)}</b> saiu da obra. Cronograma reorganizado.`);
  },
  reativar(id) { const e = eq(id); e.ativa = true; const p = (e.pausas || []).find(p => !p.ate); if (p) p.ate = agora().d; aplicar(() => `<b>${esc(e.nome)}</b> voltou para a obra.`); },
  editarEquipe(id, nome, tipo, entrada) { const e = eq(id); e.nome = nome || e.nome; e.tipo = tipo; e.entrada = entrada; fecharJanela(); aplicar(); },
};

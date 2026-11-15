import { app } from '../../nucleo/contexto.js';
import { dn, dsem, DS, MES, fSem, TURNO } from '/compartilhado/datas.js';
import { esc, cor } from '../dom.js';
import { marcadoPor } from '../formato.js';

const W = 15, NOME = 150; // largura de um turno e da coluna de nomes, em pixels

/** Aba Cronograma: linha do tempo por equipe; cada dia tem duas metades (manhã e tarde). */
export function cronograma() {
  const { S, R } = app, { c, prev } = R;
  const a = c.T0, b = Math.ceil(Math.max(prev ? prev.fimT : 0, c.now, ...[...c.feito.values()].map(f => f.T))) + 8, n = b - a;
  const X = T => NOME + (T - a) * W;
  const bloco = (cls, ini, fim, u, dica) => { const l = X(Math.max(ini, a)), w = Math.max(W - 2, X(fim) - l - 2); return `<button class="blk ${cls}" style="left:${l}px;width:${w}px" data-a="unidade" data-u="${u.id}" data-dica="${esc(dica)}">${w >= 26 ? (u.tipo === 'hall' ? 'H' + u.pav : u.nome) : ''}</button>`; };
  // cabeçalho: meses e dias
  let cab = '', grade = '', mesAnt = '';
  for (let i = a; i < b; i++) {
    const s = c.cal.slots[i]; if (!s) break; if (i > a && c.cal.slots[i - 1].d === s.d) continue;
    const larg = (c.cal.slots[i + 1] && c.cal.slots[i + 1].d === s.d ? 2 : 1) * W, seg = i === a || dn(s.d) - dn(c.cal.slots[i - 1].d) > 1;
    if (s.d.slice(0, 7) !== mesAnt) { mesAnt = s.d.slice(0, 7); cab += `<div class="m" style="left:${X(i)}px">${MES[+s.d.slice(5, 7) - 1]} ${s.d.slice(0, 4)}</div>`; }
    cab += `<div class="d ${seg ? 'sg' : ''} ${s.d === c.ag.d ? 'hoje' : ''}" style="left:${X(i)}px;width:${larg}px">${DS[dsem(s.d)][0].toUpperCase()}<br>${s.d.slice(8)}</div>`;
    if (seg) grade += `<div class="g-sem" style="left:${X(i)}px"></div>`;
  }
  // uma linha por equipe: o que já fez (verde) e o que está previsto
  const eqs = [...S.equipes.filter(e => e.ativa), ...S.equipes.filter(e => !e.ativa && c.st[e.id].peso)];
  const linhas = eqs.map(e => {
    const s = c.st[e.id]; let ant = s.ini0, h = '';
    for (const x of s.lista) { const f = c.feito.get(x.u.id); h += bloco('ok', Math.min(ant, x.T - 1), x.T, x.u, `${x.u.nome}\nConcluído ${fSem(f.d)} · ${TURNO[f.t]}${f.por ? '\n' + marcadoPor(f) : ''}`); ant = x.T; }
    if (prev && e.ativa) [...prev.plano.values()].filter(p => p.eq === e.id).forEach((p, k) => { const sl = c.cal.em(p.fim); h += bloco(k === 0 && c.iniciou ? 'and' : p.u.pav % 2 ? '' : 'alt', p.ini, p.fim, p.u, `${p.u.nome}\nPrevisão: ${fSem(sl.d)} · ${TURNO[sl.t]}`); });
    return `<div class="g-row ${e.ativa ? '' : 'fora'}"><div class="g-nome"><i class="ponto" style="color:${cor(e)};background:${cor(e)}"></i>${esc(e.nome)}</div>${h}</div>`;
  }).join('');
  return `<div class="grade entra"><div class="card"><div class="rot"><span>Cronograma por equipe · cada dia dividido em manhã e tarde</span><span class="legenda"><span><i style="background:#1f7044;border-color:#3bb873"></i>concluído</span><span><i style="background:#1b2a46;border-color:var(--marca-txt)"></i>em montagem</span><span><i style="background:var(--sup)"></i>previsto</span><button class="btn mini" data-a="gantt-hoje">Ir para hoje</button></span></div>
    <div class="gantt" id="gantt"><div class="g-in" style="width:${NOME + n * W}px"><div class="g-head"><div class="g-nome rot">Equipe</div>${cab}</div>${grade}<div class="g-hoje" style="left:${X(c.now)}px" id="g-hoje"></div>${linhas || '<p class="mudo" style="padding:20px 170px">Nenhuma equipe ativa.</p>'}</div></div>
    <p class="mudo" style="margin-top:12px">A distribuição é automática: a equipe que fica livre pega a próxima unidade, seguindo a ordem dos pavimentos. Ela se refaz sozinha a cada conclusão marcada e a cada equipe que entra ou sai.</p></div></div>`;
}

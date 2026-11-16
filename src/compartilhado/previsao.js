import { dn, dnIso } from './datas.js';
import { criarCalendario } from './calendario.js';

/**
 * Motor de previsão. Só contas, sem tela.
 * S = estado da obra; ag = { d: "AAAA-MM-DD" de hoje, t: 0 manhã | 1 tarde }.
 */
const PESO_PLANO = 2; // nas primeiras unidades a previsão ainda pesa o planejado (2 aptos de "crédito")

/** Junta tudo o que a previsão precisa: unidades, o que foi feito e o ritmo de cada equipe. */
export function contexto(S, ag) {
  const cal = criarCalendario(S), A = S.cfg.aptoDias * 2, H = S.cfg.hallDias * 2, RC = (S.cfg.recepDias ?? 5) * 2;
  const pavs = [...S.pavs].sort((a, b) => S.cfg.ordem === 'asc' ? a.n - b.n : b.n - a.n);
  const unidades = [];
  for (const p of pavs) {
    for (let k = 1; k <= p.q; k++) unidades.push({ id: p.n + '-' + k, pav: p.n, tipo: 'apto', nome: p.n + String(k).padStart(2, '0'), peso: 1 });
    unidades.push({ id: p.n + '-H', pav: p.n, tipo: 'hall', nome: 'Hall ' + p.n + 'º', peso: H / A });
  }
  // a recepção (térreo) é uma unidade só, sem pavimento: fica no fim da fila, mas pode ser concluída ou reservada a qualquer hora
  unidades.push({ id: 'R', pav: 0, tipo: 'recep', nome: 'Recepção', peso: RC / A });
  const porId = new Map(unidades.map(u => [u.id, u]));
  const now = cal.ini(ag.d, ag.t), T0 = cal.ini(S.cfg.inicio, 0);
  const feito = new Map();
  for (const id in S.feitos) if (porId.has(id)) { const f = S.feitos[id]; feito.set(id, { ...f, T: cal.fim(f.d, f.t) }); }
  const st = {}; let somaT = 0, somaP = 0;
  for (const e of S.equipes) {
    const ini0 = Math.max(T0, e.entrada ? cal.ini(e.entrada, 0) : 0);
    const lista = [...feito].filter(([, f]) => f.e === e.id).map(([id, f]) => ({ u: porId.get(id), T: f.T })).sort((a, b) => a.T - b.T);
    const peso = lista.reduce((s, x) => s + x.u.peso, 0), ultimo = lista.length ? lista[lista.length - 1].T : 0;
    let parado = 0, voltou = 0;
    for (const p of e.pausas || []) {
      const a = cal.ini(p.de, 0), b = p.ate ? cal.ini(p.ate, 0) : Infinity;
      parado += Math.max(0, Math.min(b, ultimo) - Math.max(a, ini0));
      if (p.ate) voltou = Math.max(voltou, b);
    }
    const gasto = peso ? Math.max(peso, ultimo - ini0 - parado) : 0; // turnos trabalhados até a última conclusão
    somaT += gasto; somaP += peso;
    st[e.id] = { ini0, lista, peso, ultimo, gasto, bruto: peso ? gasto / peso : null, livre: Math.max(ini0, ultimo, voltou), aptos: lista.filter(x => x.u.tipo === 'apto').length, halls: lista.filter(x => x.u.tipo === 'hall').length, recep: lista.filter(x => x.u.tipo === 'recep').length };
  }
  const ritmoGeral = (PESO_PLANO * A + somaT) / (PESO_PLANO + somaP);
  for (const e of S.equipes) { const s = st[e.id]; s.ritmo = s.peso ? (PESO_PLANO * A + s.gasto) / (PESO_PLANO + s.peso) : ritmoGeral; }
  return { cal, A, H, unidades, porId, feito, st, now, T0, ag, ritmoGeral, brutoGeral: somaP ? somaT / somaP : null, ativos: S.equipes.filter(e => e.ativa), iniciou: ag.d >= S.cfg.inicio };
}

/**
 * Distribui o que falta entre as equipes, na ordem dos pavimentos: quem fica livre primeiro pega a próxima unidade.
 * lista = [{ id, ritmo (turnos por apto), livre (instante em que começou a unidade atual) }]
 */
export function prever(c, lista, fixos) {
  const fila = c.unidades.filter(u => !c.feito.has(u.id));
  const plano = new Map();
  if (!fila.length) { let f = 0; c.feito.forEach(x => f = Math.max(f, x.T)); return { plano, fimT: f, pronto: true }; }
  if (!lista.length) return null;
  const reserva = {}, livres = [];
  for (const u of fila) { const e = fixos[u.id]; if (e && lista.some(x => x.id === e)) (reserva[e] = reserva[e] || []).push(u); else livres.push(u); }
  const eqs = lista.map(x => ({ ...x, t: x.livre, primeira: true }));
  let resta = fila.length, i = 0, fimT = 0;
  while (resta > 0) {
    let b = null; for (const e of eqs) if (!e.fora && (!b || e.t < b.t)) b = e;
    if (!b) break;
    const u = (reserva[b.id] && reserva[b.id].shift()) || livres[i++];
    if (!u) { b.fora = true; continue; }
    let fim = b.t + b.ritmo * u.peso;
    if (b.primeira) { fim = Math.max(fim, c.now + 1); b.primeira = false; } // a unidade em andamento não termina no passado
    plano.set(u.id, { u, eq: b.id, ini: b.t, fim }); b.t = fim; fimT = Math.max(fimT, fim); resta--;
  }
  return { plano, fimT };
}

/** Previsão com N equipes: mantém as mais rápidas de hoje e completa com equipes novas no ritmo médio da obra. */
export function preverComN(c, S, N, entrada, base) {
  const ord = [...c.ativos].sort((a, b) => c.st[a.id].ritmo - c.st[b.id].ritmo).slice(0, N);
  const lista = ord.map(e => ({ id: e.id, ritmo: base === 'plano' ? c.A : c.st[e.id].ritmo, livre: c.st[e.id].livre }));
  const quando = Math.max(c.now, c.T0, entrada ? c.cal.ini(entrada, 0) : 0);
  for (let i = lista.length; i < N; i++) lista.push({ id: 'nova' + i, ritmo: base === 'plano' ? c.A : c.ritmoGeral, livre: quando });
  return prever(c, lista, S.fixos);
}

/** Menor quantidade de equipes para terminar até a data `alvo` (null se nem 60 resolvem). */
export function equipesPara(c, S, alvo, entrada, base) {
  const alvoT = c.cal.fim(alvo, 1);
  for (let N = 1; N <= 60; N++) { const p = preverComN(c, S, N, entrada, base); if (p && p.fimT <= alvoT + 1e-6) return N; }
  return null;
}

/** Calcula tudo o que as telas mostram (o "resultado" R). */
export function calcular(S, ag) {
  const c = contexto(S, ag), base = S.cfg.base;
  const lista = c.ativos.map(e => ({ id: e.id, ritmo: base === 'plano' ? c.A : c.st[e.id].ritmo, livre: c.st[e.id].livre }));
  const prev = prever(c, lista, S.fixos);
  const tot = c.unidades.length, feitas = c.feito.size;
  const aptosTot = c.unidades.filter(u => u.tipo === 'apto').length, aptosFeitos = [...c.feito.keys()].filter(id => c.porId.get(id).tipo === 'apto').length;
  const hallsTot = c.unidades.filter(u => u.tipo === 'hall').length, hallsFeitos = [...c.feito.keys()].filter(id => c.porId.get(id).tipo === 'hall').length;
  const recepFeita = c.feito.has('R');
  const pesoResta = c.unidades.reduce((s, u) => s + (c.feito.has(u.id) ? 0 : u.peso), 0);
  // equipe -> unidade em que está agora
  const atual = {};
  if (prev) prev.plano.forEach(p => { if (!atual[p.eq] || p.ini < atual[p.eq].ini) atual[p.eq] = p; });
  const emAnd = new Map(); if (c.iniciou) for (const e in atual) emAnd.set(atual[e].u.id, e);
  // pavimentos
  const pav = {};
  for (const p of S.pavs) pav[p.n] = { n: p.n, tot: 0, feitos: 0, fimT: 0, and: false, incerto: false };
  for (const u of c.unidades) {
    const p = pav[u.pav]; if (!p) continue; // recepção não pertence a pavimento
    p.tot++;
    if (c.feito.has(u.id)) { p.feitos++; p.fimT = Math.max(p.fimT, c.feito.get(u.id).T); }
    else if (prev && prev.plano.has(u.id)) { p.fimT = Math.max(p.fimT, prev.plano.get(u.id).fim); if (emAnd.has(u.id)) p.and = true; }
    else p.incerto = true;
  }
  const liberados = Object.values(pav).filter(p => p.feitos === p.tot).length;
  const proximo = Object.values(pav).filter(p => p.feitos < p.tot && !p.incerto).sort((a, b) => a.fimT - b.fimT)[0];
  const fim = prev && (prev.pronto || prev.plano.size) ? c.cal.em(prev.fimT) : null;
  const prazo = S.cfg.prazo, atraso = fim && prazo ? dn(fim.d) - dn(prazo) : null;
  // próximo dia de trabalho depois de hoje (quando uma equipe nova poderia começar)
  let prox = c.cal.slots[c.cal.ini(dnIso(dn(ag.d) + 1), 0)].d; if (prox < S.cfg.inicio) prox = S.cfg.inicio;
  const precisa = prazo && feitas < tot ? equipesPara(c, S, prazo, prox, base) : null;
  // ritmo recente (últimas 2 semanas trabalhadas) e ritmo necessário, em aptos por semana
  const jan = Math.min(c.cal.porSemana * 2, c.now - c.T0);
  let rec = 0; c.feito.forEach((f, id) => { if (f.T > c.now - jan) rec += c.porId.get(id).peso; });
  const ritmoRec = jan > 0 && feitas ? rec / jan * c.cal.porSemana : null;
  const turnosAtePrazo = prazo ? c.cal.fim(prazo, 1) - c.now : null;
  const ritmoNec = prazo && feitas < tot ? (turnosAtePrazo > 0 ? pesoResta / turnosAtePrazo * c.cal.porSemana : Infinity) : null;
  const capacidade = c.ativos.reduce((s, e) => s + c.cal.porSemana / (base === 'plano' ? c.A : c.st[e.id].ritmo), 0);
  // equipes sem concluir nada há tempo demais
  const paradas = c.iniciou ? c.ativos.filter(e => atual[e.id] && c.now - c.st[e.id].livre > c.st[e.id].ritmo * 1.5 + 1).map(e => ({ e, dias: Math.floor((c.now - c.st[e.id].livre) / 2) })) : [];
  return { c, prev, tot, feitas, aptosTot, aptosFeitos, hallsTot, hallsFeitos, recepFeita, pct: tot ? feitas / tot * 100 : 0, pesoResta, atual, emAnd, pav, liberados, proximo, fim, prazo, atraso, prox, precisa, ritmoRec, ritmoNec, capacidade, turnosAtePrazo, paradas };
}

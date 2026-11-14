import { dn, dnIso } from './datas.js';

/**
 * Calendário da obra. O tempo é contado em TURNOS (manhã / tarde) dos dias trabalhados.
 * Um "instante" T é um número: T = 0 é o começo do primeiro turno, T = 1 o fim dele, e assim por diante.
 */
export function criarCalendario(S) {
  const fer = new Set(S.cfg.feriados);
  let semana = S.cfg.semana; if (!semana.some(x => x)) semana = [0, 2, 2, 2, 2, 2, 0];
  let base = dn(S.cfg.inicio);
  for (const k in S.feitos) base = Math.min(base, dn(S.feitos[k].d));
  const slots = [], ords = [];
  for (let n = base; n < base + 1800; n++) {
    const d = dnIso(n), m = fer.has(d) ? 0 : semana[new Date(n * 864e5).getUTCDay()];
    if (m >= 1) { slots.push({ d, t: 0 }); ords.push(n * 2); }
    if (m === 2) { slots.push({ d, t: 1 }); ords.push(n * 2 + 1); }
  }
  const lb = o => { let a = 0, b = ords.length; while (a < b) { const m = (a + b) >> 1; ords[m] < o ? a = m + 1 : b = m; } return a; };
  return {
    slots, porSemana: semana.reduce((a, b) => a + b, 0),
    ini: (d, t = 0) => lb(dn(d) * 2 + t),        // instante em que o turno (d,t) começa
    fim: (d, t = 1) => lb(dn(d) * 2 + t + 1),    // instante em que o turno (d,t) termina
    em: T => slots[Math.max(0, Math.min(slots.length - 1, Math.ceil(T - 1e-6) - 1))], // turno em que o instante T cai
  };
}

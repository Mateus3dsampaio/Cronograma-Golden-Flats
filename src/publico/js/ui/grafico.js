import { app } from '../nucleo/contexto.js';
import { dn, dnIso, fCurta, MES } from '/compartilhado/datas.js';

/** Gráfico de avanço (SVG): unidades concluídas por data, a previsão e a linha do prazo. */
export function grafico(W, H) {
  const { S, R } = app, { c, prev } = R, hoje = dn(c.ag.d), x0 = Math.min(dn(S.cfg.inicio), hoje);
  const fimD = R.fim ? dn(R.fim.d) : hoje, x1 = Math.max(fimD, R.prazo ? dn(R.prazo) : 0, hoje + 7) + 4;
  const L = 40, Rm = 16, T = 12, B = 26, px = d => L + (d - x0) / (x1 - x0) * (W - L - Rm), py = v => T + (1 - v / R.tot) * (H - T - B);
  const porDia = {}; c.feito.forEach(f => porDia[dn(f.d)] = (porDia[dn(f.d)] || 0) + 1);
  let ac = 0, real = `M${px(x0)},${py(0)}`;
  for (let d = x0; d <= hoje; d++) { if (porDia[d]) ac += porDia[d]; real += `L${px(d)},${py(ac)}`; }
  const fut = {}; if (prev) prev.plano.forEach(p => { const d = Math.max(hoje, dn(c.cal.em(p.fim).d)); fut[d] = (fut[d] || 0) + 1; });
  let ap = ac, prevL = `M${px(hoje)},${py(ac)}`;
  for (let d = hoje + 1; d <= fimD; d++) { if (fut[d]) ap += fut[d]; prevL += `L${px(d)},${py(ap)}`; }
  let g = '';
  for (let k = 0; k <= 4; k++) { const v = R.tot * k / 4; g += `<line x1="${L}" x2="${W - Rm}" y1="${py(v)}" y2="${py(v)}" stroke="#263444" stroke-dasharray="${k ? '2 5' : ''}"/><text x="${L - 8}" y="${py(v) + 4}" text-anchor="end" fill="#8f99a5" font-size="11">${k * 25}%</text>`; }
  for (let d = x0; d <= x1; d++) { const s = dnIso(d); if (s.slice(8) === '01') g += `<line x1="${px(d)}" x2="${px(d)}" y1="${T}" y2="${H - B}" stroke="#1d2835"/><text x="${px(d) + 5}" y="${H - 8}" fill="#8f99a5" font-size="11" font-weight="600">${MES[+s.slice(5, 7) - 1]}/${s.slice(2, 4)}</text>`; }
  const marca = (d, corL, txt, y) => `<line x1="${px(d)}" x2="${px(d)}" y1="${T}" y2="${H - B}" stroke="${corL}" stroke-width="1.5" stroke-dasharray="4 4"/><text x="${px(d)}" y="${y}" text-anchor="${px(d) > W - 90 ? 'end' : 'middle'}" fill="${corL}" font-size="11" font-weight="700">${txt}</text>`;
  return `<svg height="${H}" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fd184" stop-opacity=".35"/><stop offset="1" stop-color="#4fd184" stop-opacity="0"/></linearGradient></defs>${g}
    ${R.prazo ? `<line x1="${px(dn(S.cfg.inicio))}" y1="${py(0)}" x2="${px(dn(R.prazo))}" y2="${py(R.tot)}" stroke="#f0b04a" stroke-width="1.5" stroke-dasharray="6 5" opacity=".8"/>` + marca(dn(R.prazo), '#f0b04a', 'prazo ' + fCurta(R.prazo), T + 10) : ''}
    ${marca(hoje, '#8f99a5', 'hoje', H - B - 6)}
    <path d="${real}L${px(hoje)},${py(0)}Z" fill="url(#gr)"/>
    <path class="tr" pathLength="1" d="${real}" fill="none" stroke="#4fd184" stroke-width="2.5" stroke-linejoin="round"/>
    <path class="tr" pathLength="1" d="${prevL}" fill="none" stroke="#8aaaf0" stroke-width="2" stroke-dasharray=".008 .008" stroke-linejoin="round"/>
    ${R.fim && R.feitas < R.tot ? `<circle cx="${px(fimD)}" cy="${py(R.tot)}" r="5" fill="#8aaaf0"/><circle cx="${px(fimD)}" cy="${py(R.tot)}" r="10" fill="#8aaaf0" opacity=".25"/><text x="${px(fimD) - 12}" y="${py(R.tot) + 16}" text-anchor="end" fill="#8aaaf0" font-size="11" font-weight="700">término ${fCurta(R.fim.d)}</text>` : ''}
    <circle cx="${px(hoje)}" cy="${py(ac)}" r="4.5" fill="#4fd184"/></svg>`;
}

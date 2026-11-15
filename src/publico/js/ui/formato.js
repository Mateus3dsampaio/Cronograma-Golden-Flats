import { num, plural } from '/compartilhado/datas.js';
import { app } from '../nucleo/contexto.js';

/** Selo "X dias de atraso / adiantado" (a = dias depois do prazo; null = sem prazo). */
export const seloAtraso = a => a == null ? '' : a > 0 ? `<span class="selo al">${plural(a, 'dia', 'dias')} de atraso</span>` : a < 0 ? `<span class="selo ok">${plural(-a, 'dia', 'dias')} adiantado</span>` : `<span class="selo ok">no prazo</span>`;
/** Data e hora no fuso da obra (Fortaleza): "15/11/2026 às 14:32". */
export function fQuando(iso) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('pt-BR', { timeZone: app.fuso, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(iso)).map(x => [x.type, x.value]));
  return `${p.day}/${p.month}/${p.year} às ${p.hour}:${p.minute}`;
}
/** "Marcado por Bruna em 15/11/2026 às 14:32" (vazio para conclusões antigas, sem registro). */
export const marcadoPor = f => f && f.por ? `Marcado por ${f.por} em ${fQuando(f.em)}` : '';
/** Turnos por apartamento -> "1,8" dias por apartamento. */
export const diasApto = t => num(t / 2, 1);

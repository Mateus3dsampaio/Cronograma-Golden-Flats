import { num, plural } from '/compartilhado/datas.js';

/** Selo "X dias de atraso / adiantado" (a = dias depois do prazo; null = sem prazo). */
export const seloAtraso = a => a == null ? '' : a > 0 ? `<span class="selo al">${plural(a, 'dia', 'dias')} de atraso</span>` : a < 0 ? `<span class="selo ok">${plural(-a, 'dia', 'dias')} adiantado</span>` : `<span class="selo ok">no prazo</span>`;
/** Turnos por apartamento -> "1,8" dias por apartamento. */
export const diasApto = t => num(t / 2, 1);

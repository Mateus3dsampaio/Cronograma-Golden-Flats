/**
 * Datas e textos curtos, sem tela: usado pelo navegador e pelo servidor.
 * Datas são sempre texto "AAAA-MM-DD"; `dn` transforma em número de dia para fazer contas.
 */
export const dn = s => { const [y, m, d] = s.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
export const dnIso = n => new Date(n * 864e5).toISOString().slice(0, 10);
export const dsem = s => new Date(dn(s) * 864e5).getUTCDay();
export const DS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
export const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const TURNO = ['manhã', 'tarde'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
/** "2026-11" -> "novembro de 2026" (curto: "nov/26"). */
export const fMes = (m, curto) => curto ? MES[+m.slice(5) - 1] + '/' + m.slice(2, 4) : MESES[+m.slice(5) - 1] + ' de ' + m.slice(0, 4);
/** Dinheiro: 1234.5 -> "R$ 1.234,50". */
export const brl = v => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fData = s => s ? s.slice(8) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '—';
export const fCurta = s => s.slice(8) + '/' + s.slice(5, 7);
export const fSem = s => DS[dsem(s)] + ', ' + fCurta(s);
export const num = (v, dec = 0) => v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
export const plural = (n, a, b) => n + ' ' + (Math.abs(n) === 1 ? a : b);

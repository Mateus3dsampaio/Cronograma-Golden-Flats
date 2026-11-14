/** Atalhos para mexer na página e as cores das equipes. */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
/** Texto digitado pelo usuário sempre passa por aqui antes de ir para a tela. */
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const CORES = ['#7ba3f0', '#4fd184', '#b697ee', '#f0a06a', '#4cc9ae', '#f08a8d', '#f2c84b', '#6cc7f5', '#e58fd0', '#a3d36a'];
export const cor = e => CORES[(e.cor ?? 0) % CORES.length];
export const semMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

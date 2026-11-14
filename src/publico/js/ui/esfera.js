import { semMovimento } from './dom.js';

/**
 * Esferas de pontos (a marca visual, irmã da esfera do login do CRM).
 * Esfera grande: cada ponto é uma unidade da obra e acende quando ela é concluída, de baixo para cima.
 */
const OURO = Math.PI * (3 - Math.sqrt(5));
/** Pontos espalhados em espiral de Fibonacci sobre uma esfera de raio 1. */
export function esferaPontos(n) { return Array.from({ length: n }, (_, i) => { const y = 1 - (2 * (i + .5)) / n, r = Math.sqrt(1 - y * y), a = i * OURO; return { x: Math.cos(a) * r, y, z: Math.sin(a) * r }; }); }

const TAM = 230;
export const Esfera = {
  cv: null, pts: [], alvo: [], luz: [], ang: .6, mx: 0, my: 0,
  criar() {
    this.cv = document.createElement('canvas'); const dpr = Math.min(devicePixelRatio || 1, 2);
    this.cv.width = this.cv.height = TAM * dpr; this.ctx = this.cv.getContext('2d'); this.ctx.scale(dpr, dpr);
    this.cv.addEventListener('pointermove', e => { const r = this.cv.getBoundingClientRect(); this.mx = (e.clientX - r.left) / r.width - .5; this.my = (e.clientY - r.top) / r.height - .5; });
    this.cv.addEventListener('pointerleave', () => { this.mx = this.my = 0; });
    const parado = semMovimento(); let ult = 0, ix = 0, iy = 0;
    const passo = t => {
      requestAnimationFrame(passo);
      if (!this.cv.isConnected || t - ult < 30) return;
      const dt = ult ? Math.min(.1, (t - ult) / 1000) : 0; ult = t;
      if (!parado) this.ang += dt * .22;
      ix += (this.mx - ix) * .08; iy += (this.my - iy) * .08;
      for (let i = 0; i < this.luz.length; i++) this.luz[i] += (this.alvo[i] - this.luz[i]) * (parado ? 1 : Math.min(1, dt * 3));
      this.desenhar(this.ang + ix * 1.2, .3 + iy * .8, t / 1000);
    };
    requestAnimationFrame(passo);
  },
  /** estados: lista por unidade, de baixo para cima (0 a fazer, 1 em andamento, 2 concluída) */
  definir(estados) {
    const n = estados.length;
    if (this.pts.length !== n) { this.pts = esferaPontos(n); this.luz = new Array(n).fill(0); }
    this.alvo = estados.map((_, i) => estados[n - 1 - i]); // o ponto 0 fica no topo: o último pavimento
  },
  desenhar(ang, inc, t) {
    const c = this.ctx, m = TAM / 2, raio = TAM * .4, cos = Math.cos(ang), sin = Math.sin(ang), ci = Math.cos(inc), si = Math.sin(inc);
    c.clearRect(0, 0, TAM, TAM);
    const pr = this.pts.map((p, i) => { const x = p.x * cos + p.z * sin, z0 = -p.x * sin + p.z * cos; return { x, y: p.y * ci - z0 * si, z: p.y * si + z0 * ci, l: this.luz[i] }; }).sort((a, b) => a.z - b.z);
    for (const p of pr) {
      const f = (p.z + 1) / 2, px = m + p.x * raio, py = m - p.y * raio, feito = Math.max(0, p.l - 1), and = Math.min(1, p.l) * (1 - feito);
      if (feito > .05) { c.globalAlpha = (.1 + .16 * f) * feito; c.fillStyle = '#4fd184'; c.beginPath(); c.arc(px, py, 3 + 4 * f, 0, 7); c.fill(); }
      c.globalAlpha = (.25 + .75 * f) * (.45 + .55 * Math.max(feito, and * (.6 + .4 * Math.sin(t * 3 + px))));
      c.fillStyle = feito > .5 ? '#8ff0b5' : and > .5 ? '#8aaaf0' : '#52647c';
      c.beginPath(); c.arc(px, py, (.8 + 1.3 * f) * (1 + .5 * feito + .3 * and), 0, 7); c.fill();
    }
    c.globalAlpha = 1;
  },
};

/** Esfera simples que só gira (logo do topo e tela de entrada). `cv` precisa ter largura = altura. */
export function esferaGirando(cv, pontos = 84, vel = .28) {
  const c = cv.getContext('2d'), L = cv.width, m = L / 2, raio = L * .44, pts = esferaPontos(pontos); let ang = .9, ult = 0;
  const des = () => {
    c.clearRect(0, 0, L, L); const cos = Math.cos(ang), sin = Math.sin(ang); c.fillStyle = '#8aaaf0';
    pts.map(p => ({ x: p.x * cos + p.z * sin, y: p.y * .95 - (-p.x * sin + p.z * cos) * .31, z: p.y * .31 + (-p.x * sin + p.z * cos) * .95 })).sort((a, b) => a.z - b.z)
      .forEach(p => { const f = (p.z + 1) / 2; c.globalAlpha = .28 + .72 * f; c.beginPath(); c.arc(m + p.x * raio, m + p.y * raio, L * (.017 + .036 * f) * Math.sqrt(84 / pontos), 0, 7); c.fill(); });
  };
  const passo = t => { requestAnimationFrame(passo); if (t - ult < 33) return; ang += ult ? (t - ult) / 1000 * vel : 0; ult = t; des(); };
  semMovimento() ? des() : requestAnimationFrame(passo);
}

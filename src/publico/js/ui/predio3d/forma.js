/**
 * Forma do prédio (só proporções, sem medida real), tirada do satélite e das fotos da rua.
 * Para deixar mais parecido, mexa só aqui.
 *
 * Planta da torre, em "u" (comprimento, da ponta fina até a ponta larga) e "v" (largura):
 * - ponta fina (proa) virada para a Av. Plácido Aderaldo Castelo, lado oeste;
 * - frente em arco, virada para a esquina;
 * - fundo quase reto, virado para a R. Dr. Mauro Sampaio;
 * - ponta larga virada para a Av. Ten. Raimundo Rocha, com a fenda que separa as duas alas.
 */
export const FORMA = {
  comprimento: 10.4,       // tamanho da torre de ponta a ponta
  arco: 4.0,               // o quanto a frente curva para fora
  fundo: 1.5,              // o quanto o fundo abre na ponta larga
  fenda: { v0: .35, v1: 1.3, inicio: 78 / 96 }, // fenda entre as alas (início em fração do comprimento)
  giro: 35,                // graus: inclinação da torre em relação à rua
  andar: .8,               // altura de um pavimento
  laje: .8,                // parte do pavimento que é "cheia" (o resto é a fresta entre lajes)
  base: 1.5,               // térreo + mezanino
  topo: 1.2,               // caixa d'água e casa de máquinas
};

const PASSOS = 96, L = FORMA.comprimento, CU = 5.6, CV = 1.0;
/** Fatia onde a fenda começa. Com recuo (miolo), começa uma fatia depois, para a parede do miolo ficar atrás da parede da laje. */
const inicioFenda = r => Math.round(PASSOS * FORMA.fenda.inicio) + (r > 0 ? 1 : 0);
const frente = u => FORMA.arco * Math.sin(Math.PI * .78 * u / L);
const fundo = u => -FORMA.fundo * Math.sin(Math.PI * .5 * u / L);

/** Leva um ponto da planta (u, v) para o chão do 3D: [x (leste), z (sul)]. */
export function ponto(u, v) {
  const g = FORMA.giro * Math.PI / 180, a = u - CU, b = v - CV;
  return [a * Math.cos(g) + b * Math.sin(g), -(a * Math.sin(g) - b * Math.cos(g))];
}

/** Trechos ocupados da largura numa posição do comprimento (dois trechos onde existe a fenda). `r` = recuo para dentro. */
function trechos(i, r) {
  const u = (i + .5) * L / PASSOS, a = fundo(u) + r, b = frente(u) - r, f = FORMA.fenda;
  if (b - a < .06) return [];
  return i >= inicioFenda(r) ? [[0, f.v0 - r], [f.v1 + r, 1]] : [[0, 1]];
}

/** Quadriláteros (4 pontos [x, z]: fundo, fundo, frente, frente) da fatia fina `i` da planta. Em cada trecho, 0 = fundo, 1 = frente, outro número = valor fixo de v. */
function quadros(i, r) {
  const u0 = i * L / PASSOS, u1 = (i + 1) * L / PASSOS - (i === PASSOS - 1 && r > 0 ? r : 0);
  const v = (k, u) => k === 0 ? fundo(u) + r : k === 1 ? frente(u) - r : k;
  const qs = trechos(i, r).map(([a, b]) => [ponto(u0, v(a, u0)), ponto(u1, v(a, u1)), ponto(u1, v(b, u1)), ponto(u0, v(b, u0))]);
  // paredes que fecham o volume (o desenho só levanta parede de topo em quadro marcado com `fim`)
  const f = FORMA.fenda, n0 = inicioFenda(r);
  if (i === PASSOS - 1) qs.forEach(q => { q.fim = true; });
  if (i === n0) { const fundoDaFenda = [ponto(u0, f.v0 - r), ponto(u0, f.v0 - r), ponto(u0, f.v1 + r), ponto(u0, f.v1 + r)]; fundoDaFenda.fim = true; qs.push(fundoDaFenda); }
  return qs;
}

/**
 * Divide a planta em `n` partes de mesma área, da ponta fina para a ponta larga.
 * Devolve, para cada parte, a lista de quadriláteros que a formam.
 */
export function partes(n, r = 0) {
  const area = Array.from({ length: PASSOS }, (_, i) => { const u = (i + .5) * L / PASSOS, f = FORMA.fenda; return frente(u) - fundo(u) - (i >= PASSOS * f.inicio ? f.v1 - f.v0 : 0); });
  const total = area.reduce((s, a) => s + a, 0), saida = Array.from({ length: n }, () => []);
  let soma = 0;
  area.forEach((a, i) => { saida[Math.min(n - 1, Math.floor((soma + a / 2) / total * n))].push(...quadros(i, r)); soma += a; });
  return saida;
}

/** Retângulo da base (térreo e mezanino): pega a torre e o bloco baixo dos fundos. Devolve { x0, x1, z0, z1 }. */
export function base() {
  const ps = partes(1)[0].flat(), xs = ps.map(p => p[0]), zs = ps.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  return { x0: x0 + 1.1, x1: x1 + .25, z0: z0 - 2.2, z1: z1 + .25 };
}

/** Altura total do prédio com `n` pavimentos. */
export const alturaTotal = n => FORMA.base + n * FORMA.andar + FORMA.topo;

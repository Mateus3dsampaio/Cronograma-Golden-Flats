/**
 * Forma do prédio, tirada da planta de arquitetura (revisão 03, de 10/02/2026). Medidas em metros.
 * Para ajustar a forma, mexa só aqui.
 *
 * Pavimento tipo: duas alas curvas (arcos de mesmo raio, uma espelhada da outra pelo meio da torre)
 * com o hall (corredores, escada e elevadores) no miolo entre elas.
 * - ala leste: apartamentos 07 (ponta sul) até 01 (ponta norte);
 * - ala oeste: apartamentos 14 (ponta norte) até 08 (ponta sul).
 * "Norte" aqui é o lado de cima da prancha: a planta não traz a indicação do norte verdadeiro.
 */
export const FORMA = {
  escala: 1 / 4.4,                 // 1 unidade do 3D = 4,4 m
  centro: [22.655, 16.075],        // centro do arco da ala oeste, medido do meio da torre (o da ala leste é o oposto)
  raioFora: 39.9,                  // fachada das alas
  raioDentro: 30.4,                // parede entre os apartamentos e o corredor
  divisas: [0, 8.4, 15.5, 22.9, 30.4, 37.2, 45.8, 54], // graus: paredes entre os 7 apartamentos de cada ala, da ponta reta para a outra
  folga: .5,                       // fresta desenhada entre as unidades
  andar: 3.06,                     // altura de um pavimento
  laje: .8,                        // parte do pavimento que é "cheia" (o resto é a fresta entre lajes)
  base: 6,                         // térreo + mezanino
  topo: 3.7,                       // 19º pavimento (lazer)
  maquinas: 2.6,                   // laje técnica e casa de máquinas, em cima do miolo
  estacionamento: { x0: -28, x1: -9, y0: -19.15, y1: 23.35, altura: 3.3 }, // bloco baixo a oeste da torre (encurtado para caber na cena: o terreno vai até 38,7 m do meio da torre)
};

/** Quantos apartamentos cabem num pavimento da planta. */
export const APTOS_POR_PAV = 14;

const G = Math.PI / 180, K = FORMA.escala, PASSO = 2;

/** Ponto da planta (metros; x = direita da prancha, y = cima) levado para o chão do 3D: [x, y]. */
const p3 = (x, y) => [x * K, y * K];

/** Ponto de uma ala: ângulo `a` (graus) e raio `r` a partir do centro do arco. `lado` = 1 ala leste, -1 ala oeste. */
function naAla(lado, a, r) {
  const [cx, cy] = FORMA.centro;
  return p3(lado * (-cx + r * Math.cos(a * G)), lado * (-cy + r * Math.sin(a * G)));
}

/** Arco de `a0` até `a1` (graus), em passos pequenos. */
function arco(lado, a0, a1, r) {
  const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / PASSO));
  return Array.from({ length: n + 1 }, (_, i) => naAla(lado, a0 + (a1 - a0) * i / n, r));
}

/** Pedaço de uma ala entre dois ângulos. `f` = folga tirada de cada borda (metros). */
function setor(lado, a0, a1, f = 0) {
  const fa = f / FORMA.raioFora / G; // a folga em graus, medida na fachada
  return [...arco(lado, a0 + fa, a1 - fa, FORMA.raioFora - f), ...arco(lado, a1 - fa, a0 + fa, FORMA.raioDentro + f)];
}

/** Hall: o miolo entre as duas alas (onde os dois arcos de dentro se cruzam). */
function hall(f = 0) {
  const [cx, cy] = FORMA.centro, r = FORMA.raioDentro - f;
  const meio = Math.atan2(cy, cx) / G, abre = Math.acos(Math.hypot(cx, cy) / r) / G;
  return [...arco(1, meio - abre, meio + abre, r).slice(0, -1), ...arco(-1, meio - abre, meio + abre, r).slice(0, -1)];
}

/**
 * Contorno de cada unidade do pavimento tipo: `aptos[0]` é o apartamento 01 … `aptos[13]` é o 14; `hall` é o miolo.
 * Cada contorno é uma lista de pontos [x, y] no chão (y = cima da prancha).
 */
export function unidades() {
  const d = FORMA.divisas, f = FORMA.folga / 2;
  const aptos = Array.from({ length: APTOS_POR_PAV }, (_, k) => {
    const n = k + 1, lado = n <= 7 ? 1 : -1, i = n <= 7 ? 7 - n : 14 - n; // 07 e 14 ficam nas pontas retas
    return setor(lado, d[i], d[i + 1], f);
  });
  return { aptos, hall: hall(f) };
}

/** Contornos da torre inteira (ala leste, ala oeste e hall). `recuo` em metros: positivo encolhe, negativo alarga. */
export function torre(recuo = 0) {
  const d = FORMA.divisas, fim = d[d.length - 1];
  return [setor(1, d[0], fim, recuo), setor(-1, d[0], fim, recuo), hall(recuo)];
}

/** Retângulo do bloco baixo do estacionamento, já na escala do 3D: { x0, x1, y0, y1, altura }. */
export function estacionamento() {
  const e = FORMA.estacionamento;
  return { x0: e.x0 * K, x1: e.x1 * K, y0: e.y0 * K, y1: e.y1 * K, altura: e.altura * K };
}

/** Alturas na escala do 3D. */
export const ALTURA = { andar: FORMA.andar * K, laje: FORMA.andar * FORMA.laje * K, base: FORMA.base * K, topo: FORMA.topo * K, maquinas: FORMA.maquinas * K };

/** Altura total do prédio com `n` pavimentos. */
export const alturaTotal = n => ALTURA.base + n * ALTURA.andar + ALTURA.topo + ALTURA.maquinas;

/** Raio do círculo que cabe a torre vista de cima (para enquadrar a câmera). */
export const raioTorre = () => Math.max(...torre().flat().map(([x, y]) => Math.hypot(x, y)));

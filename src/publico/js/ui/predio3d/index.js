/**
 * Porta de entrada do prédio 3D. Carrega o Three.js só quando a aba Acompanhamento abre.
 * Se o aparelho não tiver 3D (WebGL), chama `reserva` (a esfera de pontos antiga).
 */
let cena = null, carga = null, falhou = false, pedido = null;

/** Encaixa o prédio em `lugar` e pinta os pavimentos. `aoClicar(n)` recebe o número do pavimento clicado. */
export function mostrarPredio(lugar, pavs, aoClicar, reserva) {
  pedido = { lugar, pavs, reserva };
  if (falhou) return reserva(lugar);
  if (cena) return aplicar();
  carga ??= import('./cena.js').then(m => { cena = m.criarCena(aoClicar); aplicar(); })
    .catch(e => { falhou = true; console.warn('Prédio 3D indisponível, usando a esfera.', e); if (pedido.lugar.isConnected) pedido.reserva(pedido.lugar); });
}

function aplicar() {
  if (!pedido.lugar.isConnected) return;
  pedido.lugar.appendChild(cena.el); cena.definir(pedido.pavs);
}

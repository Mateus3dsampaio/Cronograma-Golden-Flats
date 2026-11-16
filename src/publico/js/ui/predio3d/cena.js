import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { APTOS_POR_PAV, ALTURA, unidades, torre, estacionamento, alturaTotal, raioTorre } from './forma.js';
import { semMovimento } from '../dom.js';

/**
 * Prédio em 3D (Three.js): em cada pavimento, um volume por unidade, no lugar em que ela fica na planta
 * (apartamentos 01 a 14 nas duas alas curvas e o hall no miolo).
 * Cada volume acende em verde (concluída) ou azul (em montagem). Apartamento fora do contrato fica apagado.
 * Gira sozinho devagar; arrastar gira, rolar ou pinçar dá zoom.
 */
const COR = { fazer: 0x4b5d76, andamento: 0x4a80f0, feito: 0x3fc47c, neutro: 0x1d2835, miolo: 0x0d131b };

/** Volume reto: o contorno (pontos [x, y] no chão) sobe de y0 a y1. */
function volume(contorno, y0, y1) {
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(contorno.map(([x, y]) => new THREE.Vector2(x, y))), { depth: y1 - y0, bevelEnabled: false });
  g.rotateX(-Math.PI / 2); g.translate(0, y0, 0); // o "cima da prancha" vira o fundo da cena; a altura vira o eixo vertical
  return g;
}
const material = cor => new THREE.MeshStandardMaterial({ color: cor, roughness: .62, metalness: .05, side: THREE.DoubleSide });

export function criarCena(aoClicar) {
  const el = document.createElement('div'); el.className = 'v3d';
  const etiqueta = document.createElement('div'); etiqueta.className = 'v3d-etq';
  const rnd = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  rnd.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  el.append(rnd.domElement, etiqueta);

  const cena = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, .1, 400);
  cena.add(new THREE.HemisphereLight(0xdbe7ff, 0x18202c, 1.5), cam);
  const sol = new THREE.DirectionalLight(0xffffff, 2.1); sol.position.set(-12, 10, 3); cam.add(sol); // a luz acompanha a câmera: o prédio nunca fica no escuro

  const mat = { 0: material(COR.fazer), 1: material(COR.andamento), 2: material(COR.feito), neutro: material(COR.neutro), miolo: material(COR.miolo), fora: material(COR.neutro) };
  mat[1].emissive = new THREE.Color(COR.andamento); mat[2].emissive = new THREE.Color(COR.feito); mat[2].emissiveIntensity = .12;

  const ctl = new OrbitControls(cam, rnd.domElement), parado = semMovimento();
  Object.assign(ctl, { enableDamping: true, enablePan: false, autoRotate: !parado, autoRotateSpeed: .9, minPolarAngle: .35, maxPolarAngle: Math.PI / 2 - .04, rotateSpeed: .7 });

  let predio = null, andares = [], assinatura = '', dados = [], nasceu = 0, larg = 0, alt = 0, sobre = null;

  /** Monta os volumes. Só refaz quando muda a quantidade de pavimentos. */
  function montar(pavs) {
    if (predio) { cena.remove(predio); predio.traverse(o => o.geometry && o.geometry.dispose()); }
    predio = new THREE.Group(); andares = []; cena.add(predio);
    const n = pavs.length, A = ALTURA, topoTorre = A.base + n * A.andar, e = estacionamento(), u = unidades();
    const por = (m, y0, y1, recuo = 0) => torre(recuo).forEach(c => predio.add(new THREE.Mesh(volume(c, y0, y1), m)));
    // chão, estacionamento, base (térreo + mezanino), marquise, miolo escuro (dá a sombra das frestas), 19º pavimento e casa de máquinas
    const chao = new THREE.Mesh(new THREE.CircleGeometry(raioTorre() * 1.45, 64), new THREE.MeshBasicMaterial({ color: 0x8aaaf0, transparent: true, opacity: .05 })); chao.rotation.x = -Math.PI / 2; chao.position.y = -.01; predio.add(chao);
    const est = new THREE.Mesh(new THREE.BoxGeometry(e.x1 - e.x0, e.altura, e.y1 - e.y0), mat.neutro); est.position.set((e.x0 + e.x1) / 2, e.altura / 2, -(e.y0 + e.y1) / 2); predio.add(est);
    por(mat.neutro, 0, A.base - .12); por(mat.neutro, A.base - .12, A.base - .02, -.9);
    por(mat.miolo, A.base - .02, topoTorre, .5);
    por(mat.neutro, topoTorre, topoTorre + A.topo);
    predio.add(new THREE.Mesh(volume(u.hall, topoTorre + A.topo, topoTorre + A.topo + A.maquinas), mat.neutro));
    // pavimentos: os 14 apartamentos na ordem do número e, por último, o hall
    const geos = [...u.aptos, u.hall].map(c => volume(c, 0, A.laje));
    pavs.forEach((p, i) => {
      const g = new THREE.Group(); g.position.y = A.base + i * A.andar; g.userData = { i, y: g.position.y };
      geos.forEach(geo => { const m = new THREE.Mesh(geo, mat[0]); m.userData.pav = i; g.add(m); });
      predio.add(g); andares.push(g);
    });
    const meio = alturaTotal(n) / 2; ctl.target.set(0, meio, 0);
    cam.position.set(15, meio + 5, 21); enquadrar(); nasceu = performance.now();
  }

  /** Distância da câmera para o prédio caber inteiro na largura e na altura da área. */
  function enquadrar() {
    if (!larg || !andares.length) return;
    cam.aspect = larg / alt; cam.updateProjectionMatrix();
    const h = alturaTotal(andares.length) + 1.2, t = Math.tan(cam.fov * Math.PI / 360), d = Math.max(h / 2 / t, (raioTorre() + 1.5) / (t * cam.aspect)) * 1.13;
    cam.position.sub(ctl.target).setLength(d).add(ctl.target);
    ctl.minDistance = d * .45; ctl.maxDistance = d * 1.6; ctl.update();
  }

  new ResizeObserver(() => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h || (w === larg && h === alt)) return; larg = w; alt = h; rnd.setSize(w, h); enquadrar(); }).observe(el);

  // passar o mouse mostra o pavimento; clique (sem arrastar) leva à linha dele no mapa
  const raio = new THREE.Raycaster(), mira = new THREE.Vector2(); let desce = null;
  const achar = e => {
    const r = rnd.domElement.getBoundingClientRect(); mira.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    raio.setFromCamera(mira, cam); const a = raio.intersectObjects(andares, true)[0];
    return a ? a.object.userData.pav : null;
  };
  const apontar = (i, e) => {
    sobre = i; rnd.domElement.style.cursor = i == null ? '' : 'pointer';
    etiqueta.classList.toggle('on', i != null); if (i == null) return;
    etiqueta.innerHTML = dados[i].etiqueta; const r = el.getBoundingClientRect();
    etiqueta.style.left = Math.max(4, Math.min(r.width - etiqueta.offsetWidth - 4, e.clientX - r.left - etiqueta.offsetWidth / 2)) + 'px';
    etiqueta.style.top = Math.max(4, e.clientY - r.top - etiqueta.offsetHeight - 14) + 'px';
  };
  rnd.domElement.addEventListener('pointermove', e => { if (e.buttons) return apontar(null); apontar(achar(e), e); });
  rnd.domElement.addEventListener('pointerleave', () => apontar(null));
  rnd.domElement.addEventListener('pointerdown', e => { desce = [e.clientX, e.clientY]; });
  rnd.domElement.addEventListener('pointerup', e => {
    if (!desce || Math.hypot(e.clientX - desce[0], e.clientY - desce[1]) > 5) return;
    const i = achar(e); if (i != null) aoClicar(dados[i].n);
  });

  const passo = t => {
    requestAnimationFrame(passo);
    if (!el.isConnected || !larg || document.hidden) return;
    mat[1].emissiveIntensity = parado ? .25 : .22 + .2 * Math.sin(t / 380);
    const k = parado ? 9 : (t - nasceu) / 1000;
    for (const g of andares) { // entrada: os pavimentos sobem um a um; depois, o pavimento apontado salta um pouco
      const e = Math.max(0, Math.min(1, k * 2.4 - g.userData.i * .09)), s = 1 - Math.pow(1 - e, 3), alvo = g.userData.i === sobre ? 1.045 : 1;
      g.scale.y = Math.max(.001, s); g.position.y = g.userData.y - (1 - s) * 1.2; g.visible = e > 0;
      const x = g.scale.x + (alvo - g.scale.x) * .25; g.scale.x = g.scale.z = x;
    }
    ctl.update(); rnd.render(cena, cam);
  };
  requestAnimationFrame(passo);

  return {
    el,
    /** pavs: de baixo para cima, [{ n, estados: [2 concluída | 1 em montagem | 0 a fazer, ...], etiqueta: html }] */
    definir(pavs) {
      dados = pavs; const a = String(pavs.length);
      if (a !== assinatura) { assinatura = a; montar(pavs); }
      pavs.forEach((p, i) => {
        // estados: apartamentos na ordem do número e o hall por último. Vaga da planta sem apartamento no contrato fica apagada.
        const q = p.estados.length - 1, ms = andares[i].children;
        ms.forEach((m, k) => { m.material = k === APTOS_POR_PAV ? mat[p.estados[q]] : k < q ? mat[p.estados[k]] : mat.fora; });
      });
    },
  };
}

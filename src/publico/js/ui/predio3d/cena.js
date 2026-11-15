import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FORMA, partes, base, alturaTotal } from './forma.js';
import { semMovimento } from '../dom.js';

/**
 * Prédio em 3D (Three.js): uma laje por pavimento, dividida em partes iguais, uma por unidade.
 * As partes acendem em verde (concluída) ou azul (em montagem), sempre a partir da ponta fina.
 * Gira sozinho devagar; arrastar gira, rolar ou pinçar dá zoom.
 */
const COR = { fazer: 0x4b5d76, andamento: 0x4a80f0, feito: 0x3fc47c, neutro: 0x1d2835, miolo: 0x0d131b };

/** Geometria de prismas retos: cada quadrilátero [x, z] sobe de y0 a y1. As paredes entre fatias vizinhas não são desenhadas (só as marcadas com `fim`). */
function prismas(quads, y0, y1) {
  const p = [], tri = (a, b, c) => p.push(...a, ...b, ...c);
  for (const q of quads) {
    const bx = q.map(([x, z]) => [x, y0, z]), tp = q.map(([x, z]) => [x, y1, z]);
    tri(tp[0], tp[1], tp[2]); tri(tp[0], tp[2], tp[3]); tri(bx[0], bx[2], bx[1]); tri(bx[0], bx[3], bx[2]);
    for (let i = 0; i < 4; i++) { if (i % 2 && !q.fim) continue; const j = (i + 1) % 4; tri(bx[i], bx[j], tp[j]); tri(bx[i], tp[j], tp[i]); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.computeVertexNormals();
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

  const mat = { 0: material(COR.fazer), 1: material(COR.andamento), 2: material(COR.feito), neutro: material(COR.neutro), miolo: material(COR.miolo) };
  mat[1].emissive = new THREE.Color(COR.andamento); mat[2].emissive = new THREE.Color(COR.feito); mat[2].emissiveIntensity = .12;

  const ctl = new OrbitControls(cam, rnd.domElement), parado = semMovimento();
  Object.assign(ctl, { enableDamping: true, enablePan: false, autoRotate: !parado, autoRotateSpeed: .9, minPolarAngle: .35, maxPolarAngle: Math.PI / 2 - .04, rotateSpeed: .7 });

  let predio = null, andares = [], assinatura = '', dados = [], nasceu = 0, larg = 0, alt = 0, sobre = null;

  /** Monta os volumes. Só refaz quando muda a quantidade de pavimentos ou de unidades. */
  function montar(pavs) {
    if (predio) { cena.remove(predio); predio.traverse(o => o.geometry && o.geometry.dispose()); }
    predio = new THREE.Group(); andares = []; cena.add(predio);
    const n = pavs.length, F = FORMA, topoTorre = F.base + n * F.andar, b = base(), inteiro = partes(1)[0], geos = new Map();
    const caixa = (x0, x1, z0, z1, y0, y1, m) => { const c = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), m); c.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); predio.add(c); };
    // chão, base (térreo + mezanino), marquise, miolo escuro (dá a sombra das frestas) e topo
    const chao = new THREE.Mesh(new THREE.CircleGeometry(7.4, 64), new THREE.MeshBasicMaterial({ color: 0x8aaaf0, transparent: true, opacity: .05 })); chao.rotation.x = -Math.PI / 2; chao.position.y = -.01; predio.add(chao);
    caixa(b.x0, b.x1, b.z0, b.z1, 0, F.base - .12, mat.neutro);
    predio.add(new THREE.Mesh(prismas(inteiro, 0, F.base - .12), mat.neutro), new THREE.Mesh(prismas(partes(1, -.22)[0], F.base - .12, F.base - .02), mat.neutro));
    predio.add(new THREE.Mesh(prismas(partes(1, .12)[0], F.base - .02, topoTorre), mat.miolo));
    predio.add(new THREE.Mesh(prismas(inteiro, topoTorre, topoTorre + .16), mat.neutro));
    caixa(-1.5, 1.3, -1.1, 1.0, topoTorre + .16, topoTorre + F.topo, mat.neutro);
    // pavimentos
    pavs.forEach((p, i) => {
      const q = p.estados.length; if (!geos.has(q)) geos.set(q, partes(q).map(qs => prismas(qs, 0, F.andar * F.laje)));
      const g = new THREE.Group(); g.position.y = F.base + i * F.andar; g.userData = { i, y: g.position.y };
      geos.get(q).forEach(geo => { const m = new THREE.Mesh(geo, mat[0]); m.userData.pav = i; g.add(m); });
      predio.add(g); andares.push(g);
    });
    const meio = alturaTotal(n) / 2; ctl.target.set(0, meio, 0);
    cam.position.set(15, meio + 5, 21); enquadrar(); nasceu = performance.now();
  }

  /** Distância da câmera para o prédio caber inteiro na largura e na altura da área. */
  function enquadrar() {
    if (!larg || !andares.length) return;
    cam.aspect = larg / alt; cam.updateProjectionMatrix();
    const h = alturaTotal(andares.length) + 1.2, t = Math.tan(cam.fov * Math.PI / 360), d = Math.max(h / 2 / t, 6.7 / (t * cam.aspect)) * 1.13;
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
      dados = pavs; const a = pavs.map(p => p.estados.length).join(',');
      if (a !== assinatura) { assinatura = a; montar(pavs); }
      pavs.forEach((p, i) => { const ord = [...p.estados].sort((x, y) => y - x); andares[i].children.forEach((m, k) => { m.material = mat[ord[k]]; }); });
    },
  };
}

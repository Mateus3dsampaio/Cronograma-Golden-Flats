import { dn, dnIso } from './datas.js';
import { estadoPadrao } from './estado-padrao.js';
import { contexto } from './previsao.js';
import { pagEquipePadrao, modelosApto } from './pagamentos.js';

/** Obra fictícia já em andamento, só para ver como as telas ficam. Nunca é gravada. */
export function estadoExemplo(ag) {
  const E = estadoPadrao(ag.d), hoje = dn(ag.d); let ini = hoje - 45; while (new Date(ini * 864e5).getUTCDay() !== 1) ini--;
  E.conferido = true; E.cfg.inicio = dnIso(ini); E.cfg.prazo = dnIso(hoje + 60);
  const ritmos = [3.3, 3.9, 4.5, 3.6, 5.2, 4.1];
  E.equipes = ritmos.map((r, i) => ({ id: 'e' + (i + 1), nome: i < 4 ? 'Equipe ' + (i + 1) : 'Terceirizada ' + 'AB'[i - 4], tipo: i < 4 ? 'fixa' : 'terceirizada', cor: i, ativa: true, entrada: i < 4 ? '' : dnIso(ini + 14), pausas: [], pag: i === 4 ? { modo: 'fixo', pct: null, fixo: { apto: 260, hall: 180, recep: 1500 } } : pagEquipePadrao(i < 4 ? 'fixa' : 'terceirizada') }));
  // modelos fictícios: a mesma sequência em todos os pavimentos; a Terceirizada B fica "a combinar" de propósito
  const mods = modelosApto(E); for (const p of E.pavs) for (let k = 1; k <= p.q; k++) E.pag.modelos[p.n + '-' + k] = mods[k <= 4 ? 0 : k <= 8 ? 1 : k <= 10 ? 2 : 3].id;
  E.seq = 7;
  let sem = 7; const rnd = () => { sem = (sem * 1103515245 + 12345) % 2147483648; return sem / 2147483648; };
  const c = contexto(E, ag), fila = [...c.unidades], t = E.equipes.map(e => c.st[e.id].ini0);
  for (;;) {
    let k = 0; for (let i = 1; i < t.length; i++) if (t[i] < t[k]) k = i;
    const u = fila[0]; if (!u) break;
    const fim = t[k] + ritmos[k] * u.peso * (.8 + rnd() * .45); if (fim > c.now - .5) break;
    fila.shift(); const s = c.cal.em(fim); E.feitos[u.id] = { d: s.d, t: s.t, e: E.equipes[k].id }; t[k] = fim;
  }
  return E;
}

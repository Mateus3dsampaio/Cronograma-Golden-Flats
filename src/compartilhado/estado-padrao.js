import { dn, dnIso } from './datas.js';
import { pagPadrao, pagEquipePadrao } from './pagamentos.js';

/** Total de apartamentos fechado em contrato (a tela avisa se a soma dos pavimentos for diferente). */
export const APTOS_CONTRATO = 232;

/** Estado de uma obra nova. `hoje` = "AAAA-MM-DD". */
export function estadoPadrao(hoje) {
  let ini = dn(hoje); while (new Date(ini * 864e5).getUTCDay() !== 1) ini++; // próxima segunda
  return {
    v: 1, conferido: false, seq: 5,
    cfg: {
      nome: 'Golden Flats', inicio: dnIso(ini), prazo: '',
      aptoDias: 2,
      hallDias: 1,            // PROVISÓRIO: o Mateus ainda não definiu quanto leva um hall
      recepDias: 18,          // só para obra antiga, sem meta por item: a meta da recepção fica em pag.itens
      ordem: 'asc',           // asc = de baixo para cima
      semana: [0, 2, 2, 2, 2, 2, 0], // dom..sáb: 0 não trabalha, 1 só manhã, 2 dia inteiro
      feriados: [], margemCliente: 0, base: 'real',
    },
    // PROVISÓRIO: 232 aptos em 17 pavimentos (11 com 14 + 6 com 13). O Mateus corrige em Configurações.
    pavs: Array.from({ length: 17 }, (_, i) => ({ n: i + 1, q: i < 11 ? 14 : 13 })),
    equipes: [1, 2, 3, 4].map(i => ({ id: 'e' + i, nome: 'Equipe ' + i, tipo: 'fixa', cor: i - 1, ativa: true, entrada: '', pausas: [], pag: pagEquipePadrao('fixa') })),
    feitos: {},  // id da unidade -> { d: data, t: 0 manhã | 1 tarde, e: id da equipe }
    fixos: {},   // id da unidade -> id da equipe (unidade reservada para uma equipe)
    pag: pagPadrao(), // valores do contrato e o modelo de cada apartamento (aba Pagamentos)
  };
}

/** Confere se um objeto tem a forma de um estado (usado ao gravar no servidor e ao restaurar backup). */
export function estadoValido(s) {
  return !!s && typeof s === 'object' && s.cfg && typeof s.cfg.inicio === 'string' && Array.isArray(s.cfg.semana) && Array.isArray(s.cfg.feriados)
    && Array.isArray(s.pavs) && Array.isArray(s.equipes) && s.feitos && typeof s.feitos === 'object' && s.fixos && typeof s.fixos === 'object';
}

/**
 * O que a tela inteira compartilha. Um objeto só, para qualquer arquivo ler e alterar o mesmo lugar.
 * S = estado da obra (o que é gravado) · R = resultado das contas (refeito a cada desenho)
 */
export const app = {
  S: null, R: null,
  DEMO: false,            // modo exemplo: dados fictícios, nada é gravado
  aba: 'acomp',
  sim: { alvo: '', entrada: '' }, // campos do simulador (não são gravados)
  tokenCliente: '', persistente: true,
  usuario: { nome: '', admin: false }, fuso: 'America/Fortaleza',
  usuarios: null,         // lista de usuários (só o administrador carrega)
  atividades: null, filtroAtiv: '', // registro de atividades e o filtro por pessoa
};

/** Hoje e o turno atual. `?hoje=2027-01-15` na barra de endereço simula outra data (para testar). */
export function agora() {
  const q = new URLSearchParams(location.search).get('hoje'), d = new Date();
  const hoje = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  return { d: q || hoje, t: q ? 1 : (d.getHours() < 12 ? 0 : 1) };
}

export const eq = id => app.S.equipes.find(e => e.id === id);

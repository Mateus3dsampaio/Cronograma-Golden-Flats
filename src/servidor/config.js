import path from 'node:path';

/**
 * Configuração do servidor: tudo vem de variáveis de ambiente (no Railway: aba Variables).
 * SENHA        senha do administrador (obrigatória no Railway)
 * ADMIN_NOME   nome de usuário do administrador (padrão: Mateus)
 * PASTA_DADOS  onde gravar os dados; no Railway vem sozinha do Volume
 * FUSO         fuso da obra, para saber que dia é "hoje"
 */
export const emRailway = !!process.env.RAILWAY_ENVIRONMENT;
const volume = process.env.RAILWAY_VOLUME_MOUNT_PATH;
export const config = {
  porta: +process.env.PORT || 3000,
  senha: process.env.SENHA || '',
  adminNome: process.env.ADMIN_NOME || 'Mateus', // o administrador entra com este nome e a SENHA
  pastaDados: process.env.PASTA_DADOS || volume || path.resolve('dados'),
  fuso: process.env.FUSO || 'America/Fortaleza',
  /** No Railway sem Volume os dados somem a cada publicação. A tela avisa. */
  persistente: !emRailway || !!volume || !!process.env.PASTA_DADOS,
};

/** Hoje e o turno atual no fuso da obra. */
export function agora() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: config.fuso, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return { d: `${p.year}-${p.month}-${p.day}`, t: +p.hour % 24 < 12 ? 0 : 1 };
}

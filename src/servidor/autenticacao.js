import crypto from 'node:crypto';
import { config, emRailway } from './config.js';

/**
 * Acesso por usuário e senha.
 * - Administrador: nome em ADMIN_NOME (padrão "Mateus") e a senha da variável SENHA. Só ele cria e remove usuários.
 * - Demais usuários: criados pelo administrador na tela; a senha é guardada embaralhada (scrypt), nunca em texto.
 * Quem entra recebe um cookie assinado que vale 90 dias. Trocar a senha de alguém derruba os acessos dessa pessoa.
 * No computador, sem SENHA, entra direto como administrador (para testar).
 */
const COOKIE = 'gf_sessao', DIAS = 90;
const iguais = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const lerCookie = req => (req.headers.cookie || '').split(';').map(c => c.trim().split('=')).find(c => c[0] === COOKIE)?.[1] || '';
const embaralhar = (senha, sal) => crypto.scryptSync(String(senha), sal, 32).toString('hex');
const ehAdmin = nome => String(nome).trim().toLowerCase() === config.adminNome.toLowerCase();
export const semSenhaLocal = () => !config.senha && !emRailway;

/** Cria o registro de um usuário com a senha embaralhada. */
export function novoUsuario(nome, senha) { const sal = crypto.randomBytes(16).toString('hex'); return { nome, sal, hash: embaralhar(senha, sal) }; }

export function criarAutenticacao(usuarios) {
  // a assinatura inclui a senha embaralhada: se a senha muda ou o usuário é removido, o cookie antigo deixa de valer
  const assinar = (nome, segredo) => crypto.createHmac('sha256', 'golden-flats:' + config.senha).update(nome.toLowerCase() + '|' + segredo).digest('hex');
  const cookieDe = (nome, segredo) => Buffer.from(nome).toString('base64url') + '.' + assinar(nome, segredo);

  /** Quem está fazendo o pedido: { nome, admin } ou null. */
  function usuarioDe(req) {
    if (semSenhaLocal()) return { nome: config.adminNome, admin: true };
    if (!config.senha) return null;
    const [n64, ass] = lerCookie(req).split('.'); if (!n64 || !ass) return null;
    const nome = Buffer.from(n64, 'base64url').toString();
    if (ehAdmin(nome)) return iguais(ass, assinar(nome, 'admin')) ? { nome: config.adminNome, admin: true } : null;
    const u = usuarios.achar(nome);
    return u && iguais(ass, assinar(u.nome, u.hash)) ? { nome: u.nome, admin: false } : null;
  }

  // Limite de tentativas: 5 erros em 15 minutos por endereço.
  const erros = new Map(), JANELA = 15 * 60 * 1000, MAX = 5;
  return {
    usuarioDe,
    exigirLogin(req, res, next) { req.usuario = usuarioDe(req); req.usuario ? next() : res.status(401).json({ erro: 'Entre com usuário e senha.' }); },
    exigirAdmin(req, res, next) { req.usuario = usuarioDe(req); !req.usuario ? res.status(401).json({ erro: 'Entre com usuário e senha.' }) : req.usuario.admin ? next() : res.status(403).json({ erro: 'Só o administrador pode fazer isso.' }); },
    entrar(req, res) {
      if (!config.senha) return res.status(503).json({ erro: 'Falta definir a variável SENHA no Railway.' });
      const ip = req.ip, agora = Date.now(), lista = (erros.get(ip) || []).filter(t => agora - t < JANELA);
      if (lista.length >= MAX) return res.status(429).json({ erro: 'Muitas tentativas. Espere 15 minutos.' });
      const nome = String(req.body?.usuario ?? '').trim(), senha = req.body?.senha ?? '';
      let cookie = null;
      if (ehAdmin(nome)) { if (iguais(senha, config.senha)) cookie = cookieDe(config.adminNome, 'admin'); }
      else { const u = usuarios.achar(nome); if (u && iguais(embaralhar(senha, u.sal), u.hash)) cookie = cookieDe(u.nome, u.hash); }
      if (!cookie) { lista.push(agora); erros.set(ip, lista); return res.status(401).json({ erro: 'Usuário ou senha incorretos.' }); }
      erros.delete(ip);
      res.setHeader('Set-Cookie', `${COOKIE}=${cookie}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DIAS * 86400}${req.secure ? '; Secure' : ''}`);
      res.json({ ok: true });
    },
    sair(req, res) { res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`); res.json({ ok: true }); },
    ehAdmin,
  };
}

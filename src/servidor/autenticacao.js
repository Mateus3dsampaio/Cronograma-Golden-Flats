import crypto from 'node:crypto';
import { config, emRailway } from './config.js';

/**
 * Acesso por uma senha única (variável SENHA). Quem acerta recebe um cookie assinado que vale 90 dias.
 * Trocar a SENHA derruba todos os acessos. No computador, sem SENHA, entra direto (para testar).
 */
const COOKIE = 'gf_sessao', DIAS = 90;
const assinatura = () => crypto.createHmac('sha256', 'golden-flats:' + config.senha).update('sessao-v1').digest('hex');
const iguais = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const lerCookie = req => (req.headers.cookie || '').split(';').map(c => c.trim().split('=')).find(c => c[0] === COOKIE)?.[1] || '';

export const semSenhaLocal = () => !config.senha && !emRailway;
export const logado = req => semSenhaLocal() || (!!config.senha && iguais(lerCookie(req), assinatura()));

/** Barra as rotas da API para quem não entrou. */
export function exigirLogin(req, res, next) {
  if (logado(req)) return next();
  res.status(401).json({ erro: 'Entre com a senha.' });
}

// Limite de tentativas: 5 erros em 15 minutos por endereço.
const erros = new Map(), JANELA = 15 * 60 * 1000, MAX = 5;
export function entrar(req, res) {
  if (!config.senha) return res.status(503).json({ erro: 'Falta definir a variável SENHA no Railway.' });
  const ip = req.ip, agora = Date.now(), lista = (erros.get(ip) || []).filter(t => agora - t < JANELA);
  if (lista.length >= MAX) return res.status(429).json({ erro: 'Muitas tentativas. Espere 15 minutos.' });
  if (!iguais(req.body?.senha ?? '', config.senha)) { lista.push(agora); erros.set(ip, lista); return res.status(401).json({ erro: 'Senha incorreta.' }); }
  erros.delete(ip);
  res.setHeader('Set-Cookie', `${COOKIE}=${assinatura()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DIAS * 86400}${req.secure ? '; Secure' : ''}`);
  res.json({ ok: true });
}
export function sair(req, res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  res.json({ ok: true });
}

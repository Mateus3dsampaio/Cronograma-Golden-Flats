import { app } from './contexto.js';
import { garantirPagamentos } from '/compartilhado/pagamentos.js';

/**
 * Conversa com o servidor: carregar a obra, gravar a cada mudança e buscar o que outro aparelho alterou.
 * `aoStatus(tipo)` avisa a tela: 'salvando' | 'salvo' | 'erro'. `aoReceber(conflito)` avisa que chegou versão nova.
 */
let versao = 0, pendente = false, enviando = false, relogio;
export const api = { aoStatus: () => { }, aoReceber: () => { } };

function receber(j) { versao = j.versao; app.S = garantirPagamentos(j.estado); app.tokenCliente = j.tokenCliente; app.persistente = j.persistente; app.usuario = j.usuario; app.fuso = j.fuso; }
const irLogin = () => { location.href = '/login'; };

export async function carregar() {
  const r = await fetch('/api/estado'); if (r.status === 401) return irLogin();
  receber(await r.json());
}

export function salvar() {
  if (app.DEMO) return;
  pendente = true; api.aoStatus('salvando'); clearTimeout(relogio); relogio = setTimeout(enviar, 250);
}
async function enviar() {
  if (enviando || !pendente) return;
  enviando = true; pendente = false; let falhou = false;
  try {
    const r = await fetch('/api/estado', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ versao, estado: app.S }) });
    if (r.status === 401) return irLogin();
    if (r.status === 409) { receber(await r.json()); pendente = false; api.aoStatus('salvo'); api.aoReceber(true); } // outro aparelho gravou antes
    else if (!r.ok) throw new Error();
    else { versao = (await r.json()).versao; if (!pendente) api.aoStatus('salvo'); }
  } catch { falhou = pendente = true; api.aoStatus('erro'); relogio = setTimeout(enviar, 5000); } // sem internet: tenta de novo
  enviando = false; if (pendente && !falhou) enviar();
}

/** A cada 8 s pergunta ao servidor se outro aparelho mudou alguma coisa. */
export function vigiar() {
  setInterval(async () => {
    if (app.DEMO || pendente || enviando || document.hidden) return;
    try {
      const r = await fetch('/api/estado?versao=' + versao);
      if (r.status === 401) return irLogin();
      if (r.status === 200 && !pendente && !enviando) { receber(await r.json()); api.aoReceber(false); }
    } catch { }
  }, 8000);
}

export async function novoLinkCliente() {
  const r = await fetch('/api/cliente/novo-link', { method: 'POST' }); if (!r.ok) throw new Error();
  app.tokenCliente = (await r.json()).tokenCliente; versao++;
}
/** Registro de atividades (as mais recentes primeiro). */
export async function carregarAtividades() { const r = await fetch('/api/atividades'); if (r.ok) app.atividades = await r.json(); }

/** Usuários: listar, criar ou trocar senha, remover (só o administrador). Devolve a mensagem de erro, se houver. */
async function usuarios(caminho = '', opcoes) {
  const r = await fetch('/api/usuarios' + caminho, opcoes), j = await r.json().catch(() => ({}));
  if (!r.ok) return j.erro || 'Não foi possível concluir.';
  app.usuarios = j; return null;
}
export const carregarUsuarios = () => usuarios();
export const salvarUsuario = (nome, senha) => usuarios('', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome, senha }) });
export const removerUsuario = nome => usuarios('/' + encodeURIComponent(nome), { method: 'DELETE' });

export async function sair() { await fetch('/api/sair', { method: 'POST' }); irLogin(); }

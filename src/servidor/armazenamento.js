import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { config, agora } from './config.js';
import { estadoPadrao } from '../compartilhado/estado-padrao.js';
import { diferencas, carimbar } from './atividades.js';

/**
 * Tudo o que fica gravado no Volume:
 * - obra.json        { versao, tokenCliente, estado }
 * - usuarios.json    [{ nome, sal, hash }] (senhas nunca ficam em texto)
 * - atividades.json  [{ em, por, tipo, texto }] quem fez o quê e quando
 * - copias/          uma cópia da obra por dia (as últimas 30)
 * `versao` sobe a cada gravação; quem tenta gravar com versão velha é recusado (outro aparelho gravou antes).
 * Grava num arquivo temporário e troca, para nunca deixar o arquivo pela metade.
 */
const COPIAS = 30, MAX_ATIVIDADES = 5000;
const novoToken = () => crypto.randomBytes(18).toString('base64url');

export function criarArmazenamento(pasta = config.pastaDados) {
  const arq = n => path.join(pasta, n), copias = arq('copias');
  fs.mkdirSync(copias, { recursive: true });
  const lerJson = (n, padrao) => { try { return JSON.parse(fs.readFileSync(arq(n), 'utf8')); } catch { return padrao; } };
  const gravarJson = (n, dado) => { const txt = JSON.stringify(dado); fs.writeFileSync(arq(n) + '.tmp', txt); fs.renameSync(arq(n) + '.tmp', arq(n)); return txt; };

  let obra = lerJson('obra.json', null) || { versao: 0, tokenCliente: novoToken(), estado: estadoPadrao(agora().d) };
  let usuarios = lerJson('usuarios.json', []);
  const atividades = lerJson('atividades.json', []);

  function persistirObra() {
    obra.versao++;
    const txt = gravarJson('obra.json', obra);
    fs.writeFileSync(path.join(copias, agora().d + '.json'), txt);
    const antigas = fs.readdirSync(copias).filter(f => f.endsWith('.json')).sort().slice(0, -COPIAS);
    for (const f of antigas) fs.unlinkSync(path.join(copias, f));
  }
  /** Anota no registro de atividades. itens = [{ tipo, texto }] */
  function registrar(por, itens, em = new Date().toISOString()) {
    if (!itens.length) return;
    for (const i of itens) atividades.push({ em, por, ...i });
    if (atividades.length > MAX_ATIVIDADES) atividades.splice(0, atividades.length - MAX_ATIVIDADES);
    gravarJson('atividades.json', atividades);
  }

  return {
    ler: () => obra,
    /** Grava se a versão de quem enviou ainda é a atual; carimba e registra o que mudou. Devolve false se outro aparelho gravou antes. */
    gravar(estado, versaoDeQuemEnviou, usuario) {
      if (versaoDeQuemEnviou !== obra.versao) return false;
      const em = new Date().toISOString();
      carimbar(obra.estado, estado, usuario, em);
      const itens = diferencas(obra.estado, estado);
      obra.estado = estado; persistirObra(); registrar(usuario, itens, em); return true;
    },
    /** Troca o link do cliente: o link antigo para de funcionar. */
    novoLinkCliente(usuario) { obra.tokenCliente = novoToken(); persistirObra(); registrar(usuario, [{ tipo: 'config', texto: 'Gerou um novo link do cliente' }]); return obra.tokenCliente; },
    registrar,
    /** As mais recentes primeiro. */
    atividades: (limite = 500) => atividades.slice(-limite).reverse(),
    usuarios: {
      listar: () => usuarios,
      achar: nome => usuarios.find(u => u.nome.toLowerCase() === String(nome).trim().toLowerCase()),
      salvar(u) { usuarios = [...usuarios.filter(x => x.nome.toLowerCase() !== u.nome.toLowerCase()), u].sort((a, b) => a.nome.localeCompare(b.nome)); gravarJson('usuarios.json', usuarios); },
      remover(nome) { const n = usuarios.length; usuarios = usuarios.filter(x => x.nome.toLowerCase() !== nome.toLowerCase()); gravarJson('usuarios.json', usuarios); return usuarios.length < n; },
    },
  };
}

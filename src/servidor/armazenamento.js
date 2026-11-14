import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { config, agora } from './config.js';
import { estadoPadrao } from '../compartilhado/estado-padrao.js';

/**
 * Guarda a obra num arquivo só (dados/obra.json): { versao, tokenCliente, estado }.
 * - `versao` sobe a cada gravação; quem tenta gravar com versão velha é recusado (outro aparelho gravou antes).
 * - Grava num arquivo temporário e troca, para nunca deixar o arquivo pela metade.
 * - Guarda uma cópia por dia em dados/copias (as últimas 30).
 */
const COPIAS = 30;
const novoToken = () => crypto.randomBytes(18).toString('base64url');

export function criarArmazenamento(pasta = config.pastaDados) {
  const arquivo = path.join(pasta, 'obra.json'), copias = path.join(pasta, 'copias');
  fs.mkdirSync(copias, { recursive: true });
  let obra;
  try { obra = JSON.parse(fs.readFileSync(arquivo, 'utf8')); }
  catch { obra = { versao: 0, tokenCliente: novoToken(), estado: estadoPadrao(agora().d) }; }

  function persistir() {
    obra.versao++;
    const txt = JSON.stringify(obra);
    fs.writeFileSync(arquivo + '.tmp', txt); fs.renameSync(arquivo + '.tmp', arquivo);
    fs.writeFileSync(path.join(copias, agora().d + '.json'), txt);
    const antigas = fs.readdirSync(copias).filter(f => f.endsWith('.json')).sort().slice(0, -COPIAS);
    for (const f of antigas) fs.unlinkSync(path.join(copias, f));
  }
  return {
    ler: () => obra,
    /** Grava se a versão de quem enviou ainda é a atual. Devolve false se outro aparelho gravou antes. */
    gravar(estado, versaoDeQuemEnviou) {
      if (versaoDeQuemEnviou !== obra.versao) return false;
      obra.estado = estado; persistir(); return true;
    },
    /** Troca o link do cliente: o link antigo para de funcionar. */
    novoLinkCliente() { obra.tokenCliente = novoToken(); persistir(); return obra.tokenCliente; },
  };
}

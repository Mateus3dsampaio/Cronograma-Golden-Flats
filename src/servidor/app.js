import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, agora } from './config.js';
import { exigirLogin, logado, entrar, sair } from './autenticacao.js';
import { estadoValido } from '../compartilhado/estado-padrao.js';
import { calcular } from '../compartilhado/previsao.js';
import { resumoCliente } from '../compartilhado/cliente.js';

const raiz = path.dirname(fileURLToPath(import.meta.url));
const publico = path.join(raiz, '..', 'publico');

/** Monta o servidor em cima de um armazenamento (os testes passam um de mentira). */
export function criarApp(arm) {
  const app = express();
  app.set('trust proxy', 1); // o Railway fica na frente: o endereço e o https vêm dos cabeçalhos
  app.use(express.json({ limit: '2mb' }));

  app.get('/saude', (req, res) => res.json({ ok: true }));

  // Páginas
  app.get('/', (req, res) => logado(req) ? res.sendFile(path.join(publico, 'index.html')) : res.redirect('/login'));
  app.get('/login', (req, res) => logado(req) ? res.redirect('/') : res.sendFile(path.join(publico, 'login.html')));
  app.get('/c/:token', (req, res) => res.sendFile(path.join(publico, 'cliente.html')));

  // Entrar e sair
  app.post('/api/login', entrar);
  app.post('/api/sair', sair);

  // Obra (só com senha)
  const pacote = () => { const o = arm.ler(); return { versao: o.versao, estado: o.estado, tokenCliente: o.tokenCliente, persistente: config.persistente }; };
  app.get('/api/estado', exigirLogin, (req, res) => {
    if (+req.query.versao === arm.ler().versao) return res.status(204).end(); // nada mudou
    res.json(pacote());
  });
  app.put('/api/estado', exigirLogin, (req, res) => {
    const { versao, estado } = req.body || {};
    if (!estadoValido(estado)) return res.status(400).json({ erro: 'Dados inválidos.' });
    if (!arm.gravar(estado, versao)) return res.status(409).json(pacote()); // outro aparelho gravou antes
    res.json({ versao: arm.ler().versao });
  });
  app.post('/api/cliente/novo-link', exigirLogin, (req, res) => res.json({ tokenCliente: arm.novoLinkCliente() }));

  // Link do cliente (sem senha, só leitura): devolve apenas a previsão dos pavimentos
  app.get('/api/cliente/:token', (req, res) => {
    const o = arm.ler();
    if (req.params.token !== o.tokenCliente) return res.status(404).json({ erro: 'Link inválido ou trocado.' });
    res.set('Cache-Control', 'no-store').json(resumoCliente(o.estado, calcular(o.estado, agora())));
  });

  // Arquivos da tela e a lógica compartilhada (o navegador usa as mesmas contas do servidor)
  app.use('/compartilhado', express.static(path.join(raiz, '..', 'compartilhado')));
  app.use(express.static(publico, { index: false }));
  return app;
}

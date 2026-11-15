import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, agora } from './config.js';
import { criarAutenticacao, novoUsuario } from './autenticacao.js';
import { estadoValido } from '../compartilhado/estado-padrao.js';
import { calcular } from '../compartilhado/previsao.js';
import { resumoCliente } from '../compartilhado/cliente.js';

const raiz = path.dirname(fileURLToPath(import.meta.url));
const publico = path.join(raiz, '..', 'publico');

/** Monta o servidor em cima de um armazenamento (os testes passam um de mentira). */
export function criarApp(arm) {
  const app = express(), aut = criarAutenticacao(arm.usuarios);
  app.set('trust proxy', 1); // o Railway fica na frente: o endereço e o https vêm dos cabeçalhos
  app.use(express.json({ limit: '2mb' }));

  app.get('/saude', (req, res) => res.json({ ok: true }));

  // Páginas
  app.get('/', (req, res) => aut.usuarioDe(req) ? res.sendFile(path.join(publico, 'index.html')) : res.redirect('/login'));
  app.get('/login', (req, res) => aut.usuarioDe(req) ? res.redirect('/') : res.sendFile(path.join(publico, 'login.html')));
  app.get('/c/:token', (req, res) => res.sendFile(path.join(publico, 'cliente.html')));

  // Entrar e sair
  app.post('/api/login', aut.entrar);
  app.post('/api/sair', aut.sair);

  // Obra (só com login)
  const pacote = req => { const o = arm.ler(); return { versao: o.versao, estado: o.estado, tokenCliente: o.tokenCliente, persistente: config.persistente, usuario: req.usuario, fuso: config.fuso }; };
  app.get('/api/estado', aut.exigirLogin, (req, res) => {
    if (+req.query.versao === arm.ler().versao) return res.status(204).end(); // nada mudou
    res.json(pacote(req));
  });
  app.put('/api/estado', aut.exigirLogin, (req, res) => {
    const { versao, estado } = req.body || {};
    if (!estadoValido(estado)) return res.status(400).json({ erro: 'Dados inválidos.' });
    if (!arm.gravar(estado, versao, req.usuario.nome)) return res.status(409).json(pacote(req)); // outro aparelho gravou antes
    res.json({ versao: arm.ler().versao });
  });
  app.post('/api/cliente/novo-link', aut.exigirAdmin, (req, res) => res.json({ tokenCliente: arm.novoLinkCliente(req.usuario.nome) }));

  // Registro de atividades (quem fez o quê)
  app.get('/api/atividades', aut.exigirLogin, (req, res) => res.json(arm.atividades()));

  // Usuários (só o administrador)
  const nomes = () => [{ nome: config.adminNome, admin: true }, ...arm.usuarios.listar().map(u => ({ nome: u.nome, admin: false }))];
  app.get('/api/usuarios', aut.exigirAdmin, (req, res) => res.json(nomes()));
  app.post('/api/usuarios', aut.exigirAdmin, (req, res) => {
    const nome = String(req.body?.nome ?? '').trim().replace(/\s+/g, ' '), senha = String(req.body?.senha ?? '');
    if (nome.length < 2 || nome.length > 30) return res.status(400).json({ erro: 'O nome precisa ter de 2 a 30 letras.' });
    if (aut.ehAdmin(nome)) return res.status(400).json({ erro: 'Esse é o nome do administrador. A senha dele muda na variável SENHA do Railway.' });
    if (senha.length < 6) return res.status(400).json({ erro: 'A senha precisa ter pelo menos 6 caracteres.' });
    const existente = arm.usuarios.achar(nome);
    arm.usuarios.salvar(novoUsuario(existente ? existente.nome : nome, senha));
    arm.registrar(req.usuario.nome, [{ tipo: 'usuario', texto: existente ? `Trocou a senha de ${existente.nome}` : `Criou o usuário ${nome}` }]);
    res.json(nomes());
  });
  app.delete('/api/usuarios/:nome', aut.exigirAdmin, (req, res) => {
    if (!arm.usuarios.remover(req.params.nome)) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    arm.registrar(req.usuario.nome, [{ tipo: 'usuario', texto: `Removeu o usuário ${req.params.nome}` }]);
    res.json(nomes());
  });

  // Link do cliente (sem senha, só leitura): devolve apenas a previsão dos pavimentos
  app.get('/api/cliente/:token', (req, res) => {
    const o = arm.ler();
    if (req.params.token !== o.tokenCliente) return res.status(404).json({ erro: 'Link inválido ou trocado.' });
    res.set('Cache-Control', 'no-store').json(resumoCliente(o.estado, calcular(o.estado, agora())));
  });

  // Three.js (prédio 3D): só os dois arquivos usados, direto da pasta da biblioteca
  const three = path.join(raiz, '..', '..', 'node_modules', 'three');
  app.get('/vendor/three/three.module.min.js', (req, res) => res.sendFile(path.join(three, 'build', 'three.module.min.js'), { maxAge: '7d' }));
  app.get('/vendor/three/OrbitControls.js', (req, res) => res.sendFile(path.join(three, 'examples', 'jsm', 'controls', 'OrbitControls.js'), { maxAge: '7d' }));

  // Arquivos da tela e a lógica compartilhada (o navegador usa as mesmas contas do servidor)
  app.use('/compartilhado', express.static(path.join(raiz, '..', 'compartilhado')));
  app.use(express.static(publico, { index: false }));
  return app;
}

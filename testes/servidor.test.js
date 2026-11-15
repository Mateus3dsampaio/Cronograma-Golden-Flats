import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.SENHA = 'senha-de-teste';
const { criarArmazenamento } = await import('../src/servidor/armazenamento.js');
const { criarApp } = await import('../src/servidor/app.js');

const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-'));
const servidor = criarApp(criarArmazenamento(pasta)).listen(0);
const base = 'http://localhost:' + servidor.address().port;
test.after(() => { servidor.close(); fs.rmSync(pasta, { recursive: true }); });
const json = (cookie, corpo, metodo = 'POST') => ({ method: metodo, headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(corpo) });

let cookie, cookieBruna;
test('sem senha não entra; senha errada é recusada; senha certa dá o cookie', async () => {
  assert.equal((await fetch(base + '/api/estado')).status, 401);
  assert.equal((await fetch(base + '/', { redirect: 'manual' })).status, 302);
  assert.equal((await fetch(base + '/api/login', json(null, { usuario: 'Mateus', senha: 'errada' }))).status, 401);
  const r = await fetch(base + '/api/login', json(null, { usuario: 'mateus', senha: 'senha-de-teste' }));
  assert.equal(r.status, 200);
  cookie = r.headers.get('set-cookie').split(';')[0];
  assert.match(r.headers.get('set-cookie'), /HttpOnly/);
});

test('grava, recusa versão velha e guarda no arquivo', async () => {
  const a = await (await fetch(base + '/api/estado', { headers: { cookie } })).json();
  a.estado.feitos['1-1'] = { d: '2026-11-17', t: 0, e: 'e1' };
  const ok = await fetch(base + '/api/estado', json(cookie, { versao: a.versao, estado: a.estado }, 'PUT'));
  assert.equal(ok.status, 200);
  const velho = await fetch(base + '/api/estado', json(cookie, { versao: a.versao, estado: a.estado }, 'PUT')); // outro aparelho, atrasado
  assert.equal(velho.status, 409);
  assert.ok((await velho.json()).estado.feitos['1-1']);
  assert.equal((await fetch(base + '/api/estado', json(cookie, { versao: a.versao + 1, estado: { lixo: 1 } }, 'PUT'))).status, 400);
  assert.ok(JSON.parse(fs.readFileSync(path.join(pasta, 'obra.json'), 'utf8')).estado.feitos['1-1']);
  assert.equal(fs.readdirSync(path.join(pasta, 'copias')).length, 1);
  assert.equal((await fetch(base + '/api/estado?versao=' + (a.versao + 1), { headers: { cookie } })).status, 204);
});

test('link do cliente: sem senha, só a previsão; link trocado para de funcionar', async () => {
  const { tokenCliente } = await (await fetch(base + '/api/estado', { headers: { cookie } })).json();
  const r = await fetch(base + '/api/cliente/' + tokenCliente);
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.linhas.length, 17);
  assert.deepEqual(Object.keys(d).sort(), ['atualizado', 'fim', 'liberados', 'linhas', 'nome', 'pavimentos']);
  assert.equal((await fetch(base + '/api/cliente/novo-link', { method: 'POST' })).status, 401);
});

test('usuários: só o administrador cria; cada um entra com a própria senha', async () => {
  assert.equal((await fetch(base + '/api/usuarios', json(cookie, { nome: 'Bruna', senha: '123' }))).status, 400); // senha curta
  assert.equal((await fetch(base + '/api/usuarios', json(cookie, { nome: 'Mateus', senha: 'abcdef' }))).status, 400); // nome do administrador
  assert.equal((await fetch(base + '/api/usuarios', json(cookie, { nome: 'Bruna', senha: 'bruna-123' }))).status, 200);
  assert.ok(!fs.readFileSync(path.join(pasta, 'usuarios.json'), 'utf8').includes('bruna-123')); // senha nunca em texto
  assert.equal((await fetch(base + '/api/login', json(null, { usuario: 'Bruna', senha: 'errada' }))).status, 401);
  const r = await fetch(base + '/api/login', json(null, { usuario: 'bruna', senha: 'bruna-123' }));
  cookieBruna = r.headers.get('set-cookie').split(';')[0];
  const eu = await (await fetch(base + '/api/estado', { headers: { cookie: cookieBruna } })).json();
  assert.deepEqual(eu.usuario, { nome: 'Bruna', admin: false });
  assert.equal((await fetch(base + '/api/usuarios', { headers: { cookie: cookieBruna } })).status, 403);
  assert.equal((await fetch(base + '/api/usuarios', json(cookieBruna, { nome: 'Outra', senha: 'abcdef' }))).status, 403);
});

test('registro: o servidor carimba quem marcou, mesmo que o navegador diga outro nome', async () => {
  const a = await (await fetch(base + '/api/estado', { headers: { cookie: cookieBruna } })).json();
  a.estado.feitos['2-5'] = { d: '2026-11-18', t: 1, e: 'e2', por: 'Mateus', em: '2020-01-01T00:00:00.000Z' }; // tentativa de fraude
  assert.equal((await fetch(base + '/api/estado', json(cookieBruna, { versao: a.versao, estado: a.estado }, 'PUT'))).status, 200);
  const b = await (await fetch(base + '/api/estado', { headers: { cookie } })).json(), f = b.estado.feitos['2-5'];
  assert.equal(f.por, 'Bruna'); assert.ok(Date.now() - new Date(f.em) < 5000);
  assert.equal(b.estado.feitos['1-1'].por, 'Mateus'); // a do Mateus não muda de dono
  const atv = await (await fetch(base + '/api/atividades', { headers: { cookie } })).json();
  assert.equal(atv[0].por, 'Bruna'); assert.equal(atv[0].texto, 'Concluiu Apto 205 · Equipe 2 · 18/11 tarde');
  assert.ok(atv.some(x => x.texto === 'Criou o usuário Bruna' && x.por === 'Mateus'));
  // trocar a senha derruba o acesso antigo
  await fetch(base + '/api/usuarios', json(cookie, { nome: 'Bruna', senha: 'nova-senha' }));
  assert.equal((await fetch(base + '/api/estado', { headers: { cookie: cookieBruna } })).status, 401);
  assert.equal((await fetch(base + '/api/usuarios/Bruna', { method: 'DELETE', headers: { cookie } })).status, 200);
  assert.equal((await fetch(base + '/api/login', json(null, { usuario: 'Bruna', senha: 'nova-senha' }))).status, 401);
});

test('link do cliente trocado para de funcionar', async () => {
  const { tokenCliente } = await (await fetch(base + '/api/estado', { headers: { cookie } })).json();
  await fetch(base + '/api/cliente/novo-link', { method: 'POST', headers: { cookie } });
  assert.equal((await fetch(base + '/api/cliente/' + tokenCliente)).status, 404);
});

test('5 senhas erradas bloqueiam novas tentativas', async () => {
  let ultimo;
  for (let i = 0; i < 6; i++) ultimo = await fetch(base + '/api/login', json(null, { usuario: 'Mateus', senha: 'x' }));
  assert.equal(ultimo.status, 429);
});

test('entrega os arquivos do Three.js para o prédio 3D', async () => {
  for (const arq of ['three.module.min.js', 'OrbitControls.js']) {
    const r = await fetch(base + '/vendor/three/' + arq);
    assert.equal(r.status, 200); assert.match(r.headers.get('content-type'), /javascript/);
  }
});

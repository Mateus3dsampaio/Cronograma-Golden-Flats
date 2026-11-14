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

let cookie;
test('sem senha não entra; senha errada é recusada; senha certa dá o cookie', async () => {
  assert.equal((await fetch(base + '/api/estado')).status, 401);
  assert.equal((await fetch(base + '/', { redirect: 'manual' })).status, 302);
  assert.equal((await fetch(base + '/api/login', json(null, { senha: 'errada' }))).status, 401);
  const r = await fetch(base + '/api/login', json(null, { senha: 'senha-de-teste' }));
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
  await fetch(base + '/api/cliente/novo-link', { method: 'POST', headers: { cookie } });
  assert.equal((await fetch(base + '/api/cliente/' + tokenCliente)).status, 404);
});

test('5 senhas erradas bloqueiam novas tentativas', async () => {
  let ultimo;
  for (let i = 0; i < 6; i++) ultimo = await fetch(base + '/api/login', json(null, { senha: 'x' }));
  assert.equal(ultimo.status, 429);
});

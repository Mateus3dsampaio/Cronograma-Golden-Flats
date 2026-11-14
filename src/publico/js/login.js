/** Tela de entrada: esfera girando e o campo da senha. */
import { esferaGirando } from './ui/esfera.js';

esferaGirando(document.querySelector('#esfera'), 420, .2);
const form = document.querySelector('form'), erro = document.querySelector('#erro'), botao = form.querySelector('button');
form.addEventListener('submit', async ev => {
  ev.preventDefault(); botao.disabled = true; erro.textContent = '';
  try {
    const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senha: form.senha.value }) });
    if (r.ok) return location.href = '/';
    erro.textContent = (await r.json()).erro || 'Não foi possível entrar.';
  } catch { erro.textContent = 'Sem conexão. Tente de novo.'; }
  botao.disabled = false; form.senha.select();
});

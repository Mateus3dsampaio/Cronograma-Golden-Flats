/** Página do link do cliente: só a previsão de liberação dos pavimentos, calculada no servidor. */
import { fData } from '/compartilhado/datas.js';
import { esferaGirando } from './ui/esfera.js';
import { tabelaCliente } from './ui/tabela-cliente.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
esferaGirando(document.querySelector('#logo-esfera'));
const tela = document.querySelector('#tela');
async function atualizar() {
  try {
    const r = await fetch('/api/cliente/' + location.pathname.split('/').pop());
    if (!r.ok) return tela.innerHTML = '<div class="card"><p>Este link não é mais válido. Peça o link atualizado à Eccellenza.</p></div>';
    const d = await r.json();
    document.querySelector('#nome-obra').textContent = d.nome.toUpperCase(); document.title = d.nome + ' · Previsão de liberação';
    tela.innerHTML = `<div class="card"><div class="cli-cab"><div><div class="rot">Previsão de liberação dos pavimentos</div><h2>${esc(d.nome)}</h2>
      <p class="mudo">Atualizado em ${fData(d.atualizado)} · ${d.liberados} de ${d.pavimentos} pavimentos liberados · conclusão total prevista para <b style="color:inherit">${d.fim ? fData(d.fim.d) : '—'}</b></p></div>
      <button class="btn nao-imp" onclick="print()">Imprimir / PDF</button></div>${tabelaCliente(d.linhas)}
      <p class="mudo" style="margin-top:14px;font-size:12px">Datas previstas com base no andamento real da montagem; podem ser ajustadas conforme a obra avança.</p></div>`;
  } catch { if (!tela.innerHTML) tela.innerHTML = '<div class="card"><p>Sem conexão. Recarregue a página.</p></div>'; }
}
atualizar(); setInterval(atualizar, 5 * 60 * 1000);

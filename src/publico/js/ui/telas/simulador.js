import { app } from '../../nucleo/contexto.js';
import { preverComN, equipesPara } from '/compartilhado/previsao.js';
import { dn, fData, fCurta, num, plural } from '/compartilhado/datas.js';
import { diasApto } from '../formato.js';

/** Aba Simulador: quantas equipes para terminar numa data, e o término para cada quantidade de equipes. */
export function simulador() {
  const { S, R, sim } = app, { c } = R, n = c.ativos.length, base = S.cfg.base;
  if (!sim.alvo) sim.alvo = R.prazo || (R.fim ? R.fim.d : c.ag.d);
  if (!sim.entrada || sim.entrada < R.prox) sim.entrada = R.prox;
  if (R.feitas === R.tot) return `<div class="card entra"><p>Montagem concluída. Nada a simular.</p></div>`;
  const precisa = equipesPara(c, S, sim.alvo, sim.entrada, base), max = Math.min(60, Math.max(12, (precisa || 0) + 2, n + 2));
  const linhas = [];
  for (let N = 1; N <= max; N++) { const s = c.cal.em(preverComN(c, S, N, sim.entrada, base).fimT); linhas.push({ N, s, dias: dn(s.d) - dn(c.ag.d) }); }
  const pior = Math.max(...linhas.map(l => l.dias), 1), dif = precisa == null ? null : precisa - n;
  return `<div class="grade sim entra">
    <div class="card"><div class="rot">Quantas equipes para terminar em…</div>
      <div class="form"><label class="campo">Data em que quero terminar<input type="date" data-sim="alvo" value="${sim.alvo}"></label>
        <label class="campo">Equipes novas começam em<input type="date" data-sim="entrada" value="${sim.entrada}" min="${R.prox}"></label>
        <div class="campo tudo">Base do cálculo<div class="seg"><button class="${base === 'real' ? 'on' : ''}" data-a="base" data-v="real">Ritmo real da obra</button><button class="${base === 'plano' ? 'on' : ''}" data-a="base" data-v="plano">Planejado (${num(S.cfg.aptoDias, 1)} dias/apto)</button></div></div></div>
      <div class="res">${precisa ? `<div class="g" data-n="${precisa}">${precisa}</div><p><b>${plural(precisa, 'equipe', 'equipes')}</b> para terminar até ${fData(sim.alvo)}</p>
        <p>${dif > 0 ? `<span class="selo al">contratar +${dif}</span> hoje são ${n}` : dif < 0 ? `<span class="selo ok">sobram ${-dif}</span> hoje são ${n}` : `<span class="selo ok">exatamente as ${n} de hoje</span>`}</p>`
        : `<div class="g">—</div><p>Não dá para terminar até ${fData(sim.alvo)}, nem com 60 equipes começando em ${fCurta(sim.entrada)}.</p>`}</div>
      <p class="mudo" style="margin-top:14px;font-size:12px">Como eu calculo: faltam ${plural(R.tot - R.feitas, 'unidade', 'unidades')}. As equipes de hoje seguem cada uma no seu ritmo; as equipes a mais entram no ritmo médio real da obra (${diasApto(base === 'plano' ? c.A : c.ritmoGeral)} dias por apto). Com menos equipes do que hoje, saem primeiro as mais lentas.</p></div>
    <div class="card"><div class="rot"><span>Término conforme a quantidade de equipes</span><span class="mudo" style="letter-spacing:0;text-transform:none;font-weight:500">barra = tempo que falta</span></div>
      <div class="grade" style="gap:4px">${linhas.map(l => { const ok = dn(l.s.d) <= dn(sim.alvo), d = dn(l.s.d) - dn(sim.alvo);
        return `<div class="sl ${l.N === precisa ? 'meta' : l.N === n ? 'atual' : ''}"><span>${plural(l.N, 'equipe', 'equipes')}</span><div class="barra ${ok ? 'ok' : 'al'}"><i style="width:${l.dias / pior * 100}%"></i></div><span class="dir">${fData(l.s.d)}</span>
          <span class="dir">${l.N === precisa ? '<span class="selo ok">mínimo p/ a data</span>' : l.N === n ? '<span class="selo mc">hoje</span>' : `<span class="mudo">${d > 0 ? '+' : ''}${plural(d, 'dia', 'dias')}</span>`}</span></div>`; }).join('')}</div></div></div>`;
}

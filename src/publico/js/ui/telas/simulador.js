import { app } from '../../nucleo/contexto.js';
import { preverComN, equipesPara } from '/compartilhado/previsao.js';
import { dn, fData, fCurta, num, plural, brl } from '/compartilhado/datas.js';
import { cenariosTerceirizar } from '/compartilhado/terceirizar.js';
import { custoMensalFixa } from '/compartilhado/pagamentos.js';
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
          <span class="dir">${l.N === precisa ? '<span class="selo ok">mínimo p/ a data</span>' : l.N === n ? '<span class="selo mc">hoje</span>' : `<span class="mudo">${d > 0 ? '+' : ''}${plural(d, 'dia', 'dias')}</span>`}</span></div>`; }).join('')}</div></div>
    ${terceirizar()}</div>`;
}

const pc = v => num(v, 1) + '%';

/** Cartão "Vale a pena trazer terceirizadas?": compara o custo da obra com e sem equipes a mais. */
function terceirizar() {
  const { S, R, sim } = app, pct = S.pag.pctTerc, mensal = custoMensalFixa(S), C = cenariosTerceirizar(S, R, { salario: mensal, entrada: sim.entrada, pct, lucroMes: S.pag.lucroMes });
  if (!C.length) return '';
  const [base, ...mais] = C, uteis = mais.filter(x => x.pctMax != null), teto = uteis.length ? Math.min(...uteis.map(x => x.pctMax)) : null, apto = uteis.length ? Math.min(...uteis.map(x => x.porApto)) : null;
  const melhor = pct != null && uteis.length ? uteis.reduce((a, b) => b.saldo > a.saldo ? b : a) : null;
  const resumo = !base.fixas ? '<b>Não há equipe fixa ativa na obra.</b> Sem salário de equipe fixa para economizar, a conta não se aplica.'
    : teto == null || teto <= 0 ? '<b>Com os números de hoje não compensa:</b> a economia de salário não cobre o que a terceirizada montaria.'
      : `Vale a pena pagar à terceirizada <b>até ${pc(teto)} do valor da unidade</b>, perto de <b>${brl(apto)} por apartamento</b>. Abaixo disso a obra sai mais barata com terceirizadas; acima, sai mais cara. ${melhor ? (melhor.saldo > 0 ? `Pagando ${pc(pct)}, o melhor cenário é <b>+${melhor.k}</b>: sobram <b>${brl(melhor.saldo)}</b> e a obra termina em ${fData(melhor.fim)}.` : `Pagando ${pc(pct)} você <b>perde dinheiro</b> em qualquer cenário; o ganho é só de prazo.`) : ''}`;
  return `<div class="card terc"><div class="rot"><span>Vale a pena trazer terceirizadas?</span><span class="mudo" style="letter-spacing:0;text-transform:none;font-weight:500">supondo que montem no ritmo de uma equipe fixa · entram em ${fCurta(sim.entrada)}</span></div>
    <div class="terc-topo"><div class="veredito ${teto > 0 ? 'ok' : 'nt'}"><div class="ic">${teto > 0 ? '$' : 'i'}</div><div>${resumo}</div></div>
      <div class="terc-campos"><label class="campo">Salário do montador fixo (R$)<input type="number" min="0" step="50" inputmode="decimal" data-pg="salario" value="${S.pag.salarioFixa}"></label>
        <label class="campo">Salário do ajudante (R$)<input type="number" min="0" step="50" inputmode="decimal" data-pg="ajudante" value="${S.pag.salarioAjudante}"></label>
        <label class="campo">Encargos sobre os salários (%)<input type="number" min="0" max="200" step="1" inputmode="decimal" data-pg="encargos" value="${S.pag.encargos}"></label>
        <label class="campo" data-dica="Lucro que a loja faz num mês normal montando as próprias vendas.\nEnquanto a obra ocupa as equipes fixas, esse lucro fica parado.">Lucro mensal da loja parado pela obra (R$)<input type="number" min="0" step="500" inputmode="decimal" data-pg="lucro-mes" value="${S.pag.lucroMes || ''}" placeholder="não considerar"></label>
        <label class="campo">% que penso em pagar à terceirizada<input type="number" min="0" max="100" step="0.1" inputmode="decimal" placeholder="opcional" data-pg="pct-terc" value="${pct ?? ''}"></label></div>
      <p class="mudo terc-custo">Cada equipe fixa custa <b>${brl(mensal)} por mês</b> (montador + ajudante${S.pag.encargos ? ' + ' + num(S.pag.encargos) + '% de encargos' : ''}) mais o percentual do que monta. Na terceirizada, ajudante e ferramenta são por conta dela: o custo é só o percentual combinado.${S.pag.lucroMes ? ` Cada mês a menos de obra também devolve <b>${brl(S.pag.lucroMes)}</b> de lucro das montagens da loja.` : ' <b>Falta o maior número:</b> informe quanto a loja lucra num mês normal de montagens; é isso que fica parado enquanto as 4 equipes estão na obra.'}</p></div>
    <div class="rolagem"><table class="tab terc-tab"><thead><tr><th>Terceirizadas a mais</th><th class="dir">Término</th><th class="dir">Salários das ${base.fixas} fixas</th><th class="dir">% das equipes de hoje</th><th class="dir">Economia</th><th class="dir">Pode pagar até</th>${pct != null ? `<th class="dir">Custo a ${pc(pct)}</th><th class="dir">Saldo</th>` : ''}</tr></thead>
      <tbody>${C.map(x => `<tr class="${x === melhor && x.saldo > 0 ? 'melhor' : ''}"><td><b>${x.k ? '+' + x.k : 'Nenhuma (hoje)'}</b>${x.k ? `<small class="mudo">montam ${plural(x.nTerc, 'unidade', 'unidades')}</small>` : ''}</td>
        <td class="dir">${fData(x.fim)}${x.k ? `<small class="mudo">${plural(dn(x.fim) - dn(base.fim), 'dia', 'dias')}</small>` : ''}</td><td class="dir">${brl(x.salarios)}<small class="mudo">${num(x.meses, 1)} meses de obra</small></td><td class="dir">${brl(x.comissao)}</td>
        <td class="dir">${x.k ? '<b>' + brl(x.economia) + '</b>' + (x.lucroLiberado ? `<small class="mudo">${brl(x.lucroLiberado)} é lucro da loja</small>` : '') : '—'}</td><td class="dir">${x.pctMax == null ? '—' : `<b>${pc(x.pctMax)}</b><small class="mudo">${brl(x.porApto)} por apto</small>`}</td>
        ${pct != null ? `<td class="dir">${x.k ? brl(x.custoTerc) : '—'}</td><td class="dir">${x.k ? `<span class="selo ${x.saldo > 0 ? 'ok' : 'al'}">${x.saldo > 0 ? 'sobra ' : 'falta '}${brl(Math.abs(x.saldo))}</span>` : '—'}</td>` : ''}</tr>`).join('')}</tbody></table></div>
    <p class="mudo" style="margin-top:12px;font-size:12px"><b>Como eu calculo:</b> cada cenário usa a previsão do cronograma. "Salários das fixas" é o custo mensal das equipes fixas (montador e ajudante) pelos meses que ainda faltam de obra. "Economia" é o que você deixa de gastar com as equipes de hoje (menos meses de salário e menos percentual, porque a terceirizada monta parte das unidades) mais o lucro da loja que volta por terminar antes, se você informou. "Pode pagar até" é essa economia dividida pelo valor do que a terceirizada monta: é o ponto de empate.${base.aCombinar ? ' Equipes de hoje com pagamento "a combinar" entram com custo zero.' : ''}
      <br><b>O que a conta não enxerga:</b> ela supõe que, liberadas, as equipes fixas voltam a montar as vendas da loja (se ficarem paradas, não há economia). Ficam de fora o ganho de receber antes do cliente da obra, multa por atraso e o risco de qualidade e retrabalho da terceirizada.</p></div>`;
}

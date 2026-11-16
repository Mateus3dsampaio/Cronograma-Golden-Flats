/**
 * Pagamento das equipes. Só contas, sem tela.
 * Regra do Mateus (16/11/2026): a equipe recebe pelo que concluiu dentro do mês.
 * Vale a data da conclusão: até o último dia entra no mês; no dia 1º já é do mês seguinte.
 */

/** Percentual padrão da equipe fixa sobre o valor da unidade. Terceirizada entra "a combinar". */
export const PCT_FIXA = 3;

/**
 * Valores do orçamento Italínea enviado pelo Mateus em 16/11/2026. `qtd` = quantidade em contrato. Editáveis na aba Pagamentos.
 * `dias` = meta de montagem de uma unidade por uma equipe (PROVISÓRIO: o Mateus define em Configurações). A previsão parte dessa meta.
 */
const ITENS_CONTRATO = [
  { id: 'm1', tipo: 'apto', nome: 'Apartamento 01 - Casal', curto: 'Casal', valor: 7789.74, qtd: 69, dias: 2 },
  { id: 'm2', tipo: 'apto', nome: 'Apartamento 02 - 2 Camas', curto: '2 Camas', valor: 7789.74, qtd: 69, dias: 2 },
  { id: 'm3', tipo: 'apto', nome: 'Apartamento 03 - 3 Camas', curto: '3 Camas', valor: 8299.06, qtd: 30, dias: 2 },
  { id: 'm4', tipo: 'apto', nome: 'Apartamento Completo', curto: 'Completo', valor: 11417.81, qtd: 64, dias: 2 },
  { id: 'hall', tipo: 'hall', nome: 'Hall Pavimentos', curto: 'Hall', valor: 5457.17, qtd: 17, dias: 1 },
  { id: 'recep', tipo: 'recep', nome: 'Recepção', curto: 'Recepção', valor: 55594.33, qtd: 1, dias: 5 },
];

/** Parte de pagamentos de uma obra nova. `modelos` = id do apartamento -> id do modelo (m1..m4). */
export const pagPadrao = () => ({ itens: ITENS_CONTRATO.map(i => ({ ...i })), modelos: {} });

/** Como uma equipe é paga: percentual do valor da unidade ou valor fixo em reais por unidade. `null` = ainda a combinar. */
export const pagEquipePadrao = tipo => ({ modo: 'pct', pct: tipo === 'fixa' ? PCT_FIXA : null, fixo: { apto: null, hall: null, recep: null } });

/** Completa obras gravadas antes de existirem os pagamentos e a recepção (não apaga nada do que já existe). */
export function garantirPagamentos(S) {
  if (S.cfg.recepDias == null) S.cfg.recepDias = 5;
  if (!S.pag || !Array.isArray(S.pag.itens)) S.pag = pagPadrao();
  for (const p of ITENS_CONTRATO) if (!S.pag.itens.some(i => i.id === p.id)) S.pag.itens.push({ ...p });
  if (!S.pag.modelos) S.pag.modelos = {};
  // meta de dias por item: obra gravada antes dela herda os prazos gerais que já estavam em uso
  for (const i of S.pag.itens) if (!(i.dias > 0)) i.dias = i.tipo === 'apto' ? S.cfg.aptoDias : i.tipo === 'hall' ? S.cfg.hallDias : S.cfg.recepDias;
  for (const e of S.equipes) {
    if (!e.pag) e.pag = pagEquipePadrao(e.tipo);
    if (!e.pag.fixo) e.pag.fixo = { apto: null, hall: null, recep: null };
  }
  return S;
}

export const modelosApto = S => S.pag.itens.filter(i => i.tipo === 'apto');

/** Item do contrato de uma unidade (null = apartamento ainda sem modelo marcado). */
export function itemDe(S, u) {
  const id = u.tipo === 'apto' ? S.pag.modelos[u.id] : u.tipo;
  return S.pag.itens.find(i => i.id === id) || null;
}

const centavos = v => Math.round(v * 100) / 100;

/**
 * Quanto a equipe `e` recebe pela unidade `u`.
 * falta: 'combinar' (equipe sem percentual ou valor definido) | 'modelo' (apartamento sem modelo) | null
 */
export function valorPago(S, e, u) {
  const item = itemDe(S, u), p = (e && e.pag) || pagEquipePadrao(e && e.tipo), base = item ? item.valor : null;
  if (p.modo === 'fixo') {
    const v = p.fixo ? p.fixo[u.tipo] : null;
    return v == null ? { item, base, pct: null, pagar: null, falta: 'combinar' } : { item, base, pct: null, pagar: centavos(v), falta: null };
  }
  if (p.pct == null) return { item, base, pct: null, pagar: null, falta: 'combinar' };
  if (!item) return { item, base, pct: p.pct, pagar: null, falta: 'modelo' };
  return { item, base, pct: p.pct, pagar: centavos(item.valor * p.pct / 100), falta: null };
}

/** "3% do valor da unidade" / "valor fixo: R$ 200,00 por apto…" / "a combinar". `brl` formata o dinheiro. */
export function formaTexto(e, brl) {
  const p = e.pag || pagEquipePadrao(e.tipo);
  if (p.modo === 'fixo') {
    const f = p.fixo || {}, partes = [['apto', 'apartamento'], ['hall', 'hall'], ['recep', 'recepção']].filter(([k]) => f[k] != null).map(([k, n]) => `${brl(f[k])} por ${n}`);
    return partes.length ? 'Valor fixo: ' + partes.join(' · ') : 'A combinar';
  }
  return p.pct == null ? 'A combinar' : `${String(p.pct).replace('.', ',')}% do valor da unidade`;
}

/**
 * Tudo o que a aba Pagamentos mostra. `c` = contexto da previsão; `prev` = previsão (para os meses que ainda vêm).
 * Devolve:
 *  linhas    = uma por unidade concluída: { u, f, e (id da equipe), mes "AAAA-MM", item, base, pct, pagar, falta }
 *  previstas = o mesmo para o que ainda vai ser montado, no mês previsto
 *  meses     = meses com conclusão ou previsão, em ordem (sempre inclui o mês de hoje)
 *  cel       = equipe -> mês -> { pagar, n, faltas, prev, nPrev, faltasPrev }
 */
export function calcularPagamentos(S, c, prev) {
  const equipe = id => S.equipes.find(e => e.id === id);
  const linhas = [], previstas = [], cel = {}, meses = new Set([c.ag.d.slice(0, 7)]);
  const casa = (e, mes) => { meses.add(mes); const x = cel[e] = cel[e] || {}; return x[mes] = x[mes] || { pagar: 0, n: 0, faltas: 0, prev: 0, nPrev: 0, faltasPrev: 0 }; };
  c.feito.forEach((f, id) => {
    const u = c.porId.get(id), l = { u, f, e: f.e, mes: f.d.slice(0, 7), ...valorPago(S, equipe(f.e), u) }, k = casa(l.e, l.mes);
    linhas.push(l); k.n++; if (l.falta) k.faltas++; else k.pagar = centavos(k.pagar + l.pagar);
  });
  if (prev) prev.plano.forEach(p => {
    if (!equipe(p.eq)) return; // equipe simulada não entra
    const s = c.cal.em(p.fim), l = { u: p.u, d: s.d, e: p.eq, mes: s.d.slice(0, 7), ...valorPago(S, equipe(p.eq), p.u) }, k = casa(l.e, l.mes);
    previstas.push(l); k.nPrev++; if (l.falta) k.faltasPrev++; else k.prev = centavos(k.prev + l.pagar);
  });
  linhas.sort((a, b) => a.f.d.localeCompare(b.f.d) || a.f.t - b.f.t || a.u.nome.localeCompare(b.u.nome, 'pt-BR', { numeric: true }));
  const soma = (campo, filtro) => { let t = 0; for (const e in cel) for (const m in cel[e]) if (filtro(e, m)) t += cel[e][m][campo]; return centavos(t); };
  return {
    linhas, previstas, cel, meses: [...meses].sort(),
    totalMes: (m, campo = 'pagar') => soma(campo, (e, mm) => mm === m),
    totalEquipe: (e, campo = 'pagar') => soma(campo, ee => ee === e),
    total: (campo = 'pagar') => soma(campo, () => true),
    semModelo: [...c.unidades].filter(u => u.tipo === 'apto' && !S.pag.modelos[u.id]).length,
    aCombinar: S.equipes.filter(e => linhas.some(l => l.e === e.id && l.falta === 'combinar') || (e.ativa && valorPago(S, e, { tipo: 'hall' }).falta === 'combinar')),
  };
}

/** Linhas do extrato de uma equipe (mes = "AAAA-MM" ou '' para todos os meses) e o total a pagar. */
export function extratoEquipe(P, e, mes) {
  const linhas = P.linhas.filter(l => l.e === e && (!mes || l.mes === mes));
  return { linhas, total: centavos(linhas.reduce((s, l) => s + (l.pagar || 0), 0)), faltas: linhas.filter(l => l.falta).length };
}

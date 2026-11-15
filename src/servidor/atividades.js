import { fCurta, fData, TURNO } from '../compartilhado/datas.js';

/**
 * Registro de atividades: compara a obra antes e depois de uma gravação e descreve o que mudou.
 * Quem compara é o servidor, então o registro não depende do que o navegador diz.
 */
const nomeUnidade = id => { const [p, k] = id.split('-'); return k === 'H' ? `Hall ${p}º` : `Apto ${p}${k.padStart(2, '0')}`; };
const ROTULOS = { nome: 'o nome da obra', inicio: 'o início da montagem', prazo: 'o prazo combinado', aptoDias: 'os dias por apartamento', hallDias: 'os dias por hall', ordem: 'a ordem de montagem', margemCliente: 'a margem de segurança do cliente', base: 'a base da previsão', semana: 'os dias de trabalho', feriados: 'os feriados' };
const valor = (k, v) => k === 'inicio' || k === 'prazo' ? (v ? fData(v) : 'sem data') : k === 'ordem' ? (v === 'asc' ? 'de baixo para cima' : 'de cima para baixo') : k === 'base' ? (v === 'plano' ? 'planejado' : 'ritmo real') : String(v);
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const MUITAS = 15; // acima disso é restauração de backup ou obra zerada: vira uma linha só

/** Devolve a lista de { tipo, texto } do que mudou entre `antes` e `depois`. */
export function diferencas(antes, depois) {
  const itens = [], add = (tipo, texto) => itens.push({ tipo, texto });
  const equipe = id => (depois.equipes.find(e => e.id === id) || antes.equipes.find(e => e.id === id) || {}).nome || 'equipe removida';
  const conc = f => `${equipe(f.e)} · ${fCurta(f.d)} ${TURNO[f.t]}`;
  // conclusões
  const mud = [];
  for (const id in depois.feitos) { const a = antes.feitos[id], d = depois.feitos[id];
    if (!a) mud.push(['concluiu', `Concluiu ${nomeUnidade(id)} · ${conc(d)}`]);
    else if (a.d !== d.d || a.t !== d.t || a.e !== d.e) mud.push(['corrigiu', `Corrigiu ${nomeUnidade(id)}: ${conc(d)} (antes: ${conc(a)})`]); }
  for (const id in antes.feitos) if (!depois.feitos[id]) mud.push(['desfez', `Desfez a conclusão de ${nomeUnidade(id)} (${conc(antes.feitos[id])})`]);
  if (mud.length > MUITAS) add('massa', `Alterou ${mud.length} conclusões de uma vez (backup restaurado ou obra zerada)`);
  else mud.forEach(m => add(...m));
  // reservas
  for (const id in depois.fixos) if (antes.fixos[id] !== depois.fixos[id]) add('reserva', `Reservou ${nomeUnidade(id)} para ${equipe(depois.fixos[id])}`);
  for (const id in antes.fixos) if (!depois.fixos[id] && !depois.feitos[id]) add('reserva', `Tirou a reserva de ${nomeUnidade(id)}`);
  // equipes
  for (const d of depois.equipes) { const a = antes.equipes.find(e => e.id === d.id);
    if (!a) add('equipe', `Adicionou a equipe ${d.nome}`);
    else if (a.ativa && !d.ativa) add('equipe', `Retirou a equipe ${d.nome} da obra`);
    else if (!a.ativa && d.ativa) add('equipe', `Reativou a equipe ${d.nome}`);
    else if (a.nome !== d.nome || a.tipo !== d.tipo || a.entrada !== d.entrada) add('equipe', `Editou a equipe ${d.nome}${a.nome !== d.nome ? ` (antes: ${a.nome})` : ''}`); }
  for (const a of antes.equipes) if (!depois.equipes.some(e => e.id === a.id)) add('equipe', `Excluiu a equipe ${a.nome}`);
  // configurações
  for (const k in ROTULOS) if (!igual(antes.cfg[k], depois.cfg[k])) add('config', Array.isArray(depois.cfg[k]) ? `Alterou ${ROTULOS[k]}` : `Alterou ${ROTULOS[k]}: de ${valor(k, antes.cfg[k])} para ${valor(k, depois.cfg[k])}`);
  if (!igual(antes.pavs, depois.pavs)) add('config', 'Alterou os apartamentos por pavimento');
  if (!antes.conferido && depois.conferido) add('config', 'Marcou os dados da obra como conferidos');
  return itens;
}

/**
 * Carimba em cada conclusão quem marcou (`por`) e quando (`em`). Conclusão que não mudou mantém o carimbo antigo,
 * mesmo que o navegador mande outro.
 */
export function carimbar(antes, depois, usuario, quando) {
  for (const id in depois.feitos) {
    const a = antes.feitos[id], d = depois.feitos[id];
    if (a && a.d === d.d && a.t === d.t && a.e === d.e) { d.por = a.por; d.em = a.em; if (!a.por) { delete d.por; delete d.em; } }
    else { d.por = usuario; d.em = quando; }
  }
}

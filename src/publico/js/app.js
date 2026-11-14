/** Ponto de partida da tela principal: carrega a obra do servidor, liga os eventos e desenha. */
import { api, carregar, vigiar } from './nucleo/api.js';
import { $ } from './ui/dom.js';
import { Esfera, esferaGirando } from './ui/esfera.js';
import { desenhar, mostrarStatus } from './ui/desenhar.js';
import { ligarEventos } from './ui/eventos.js';
import { toast } from './ui/janelas.js';

api.aoStatus = mostrarStatus;
api.aoReceber = conflito => { desenhar(false); toast(conflito ? 'Outro aparelho alterou a obra ao mesmo tempo. Atualizei a tela: confira se a sua última marcação entrou.' : 'Atualizado com o que foi marcado em outro aparelho.', conflito); };

Esfera.criar(); esferaGirando($('#logo-esfera'));
try {
  await carregar(); ligarEventos(); desenhar(true); vigiar();
  if (document.fonts?.ready) document.fonts.ready.then(() => desenhar(false));
} catch { $('#tela').innerHTML = '<div class="card"><p>Não consegui carregar a obra. Confira a internet e recarregue a página.</p></div>'; }

import { config, emRailway } from './config.js';
import { criarArmazenamento } from './armazenamento.js';
import { criarApp } from './app.js';

const app = criarApp(criarArmazenamento());
app.listen(config.porta, () => {
  console.log(`Cronograma no ar na porta ${config.porta}. Dados em: ${config.pastaDados}`);
  if (emRailway && !config.senha) console.warn('ATENÇÃO: defina a variável SENHA. Sem ela ninguém consegue entrar.');
  if (!config.persistente) console.warn('ATENÇÃO: sem Volume. Os dados somem na próxima publicação.');
});

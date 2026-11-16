# Mapa do código

Três partes, cada uma numa pasta de `src/`:

| Pasta | O que é | Mexe em tela? |
|---|---|---|
| `src/compartilhado/` | **Lógica**: as contas da previsão. Usada pelo navegador e pelo servidor. | Não |
| `src/servidor/` | **Back-end**: senha, gravação dos dados, link do cliente. | Não |
| `src/publico/` | **Front-end**: páginas, visual (CSS) e comportamento da tela (JS). | Sim |

## Onde mexer para…
| Quero mudar… | Arquivo |
|---|---|
| Como a previsão é calculada, ritmo das equipes, simulador | `src/compartilhado/previsao.js` |
| Dias de trabalho, feriados, contagem de turnos | `src/compartilhado/calendario.js` |
| Valores iniciais da obra (pavimentos, dias por apto, equipes) | `src/compartilhado/estado-padrao.js` |
| Meta de dias de cada modelo, do hall e da recepção (valores iniciais) | `src/compartilhado/pagamentos.js` (a tela fica em Configurações) |
| O que o cliente vê e o texto do WhatsApp | `src/compartilhado/cliente.js` |
| Regra do pagamento das equipes, percentual padrão (3%), valores do contrato | `src/compartilhado/pagamentos.js` |
| A aba Pagamentos e o extrato em PDF | `src/publico/js/ui/telas/pagamentos.js` |
| O mapa de modelos dos apartamentos | `src/publico/js/ui/telas/configuracoes.js` |
| A logomarca Italínea | `src/publico/img/italinea.svg` (tamanho e posição em `css/moldura.css`) |
| A forma do prédio 3D (curva, fenda, altura dos andares, base, topo) | `src/publico/js/ui/predio3d/forma.js` |
| Cores, luz, giro e zoom do prédio 3D | `src/publico/js/ui/predio3d/cena.js` |
| Cores, sombras, fontes | `src/publico/css/tokens.css` |
| Visual de uma tela | `src/publico/css/telas.css` |
| Conteúdo de uma tela | `src/publico/js/ui/telas/<tela>.js` |
| O que um botão faz | `src/publico/js/ui/eventos.js` e `acoes.js` |
| Usuários, senha e tempo de acesso | `src/servidor/autenticacao.js` |
| O texto de cada linha do registro de atividades | `src/servidor/atividades.js` |
| A tela do registro de atividades | `src/publico/js/ui/telas/atividades.js` |
| Como e onde os dados são gravados | `src/servidor/armazenamento.js` |

## Lógica (`src/compartilhado/`)
| Arquivo | O que faz |
|---|---|
| `datas.js` | Contas e formatos de data, mês por extenso, dinheiro, plural, números |
| `estado-padrao.js` | Obra nova (valores iniciais) e conferência do formato dos dados |
| `calendario.js` | Transforma dias trabalhados em turnos (manhã/tarde) |
| `previsao.js` | Motor: ritmo de cada equipe, distribuição das unidades (apartamentos, halls e a recepção, que fica no fim da fila), previsão, simulador, indicadores |
| `pagamentos.js` | Itens do contrato (valor e meta de dias de cada um) e pagamento das equipes: valores do contrato, modelo de cada apartamento, quanto cada equipe recebe por unidade (percentual ou valor fixo), soma por mês pela data da conclusão, previsão dos meses seguintes e extrato |
| `cliente.js` | Previsão por pavimento para o cliente, com margem de segurança |
| `exemplo.js` | Obra fictícia do "modo exemplo" |

## Servidor (`src/servidor/`)
| Arquivo | O que faz |
|---|---|
| `index.js` | Liga o servidor |
| `app.js` | Rotas: páginas, `/api/login`, `/api/estado`, `/api/atividades`, `/api/usuarios`, `/api/cliente/...`, `/saude`, `/vendor/three/...` (biblioteca do prédio 3D, vinda de `node_modules`) |
| `autenticacao.js` | Login por usuário e senha (administrador pela variável `SENHA`, demais com senha embaralhada), cookie de 90 dias, limite de 5 erros em 15 min |
| `atividades.js` | Compara a obra antes e depois de cada gravação: descreve o que mudou (conclusões, equipes, configurações, pagamentos e modelos) e carimba quem marcou cada conclusão e quando |
| `armazenamento.js` | Completa obras antigas com os campos de pagamento; grava no Volume a obra (`obra.json`), os usuários e o registro de atividades; controla versão (dois aparelhos) e a cópia diária |
| `config.js` | Variáveis de ambiente e "que dia é hoje" no fuso da obra |

## Tela (`src/publico/`)
| Arquivo | O que faz |
|---|---|
| `index.html` / `login.html` / `cliente.html` | Página principal, entrada e página pública do cliente |
| `img/italinea.svg` | Logomarca Italínea (só o nome, em branco, sem moldura), baixada do site oficial |
| `css/tokens.css` | Cores, raios, sombras e fundo |
| `css/moldura.css` | Barra de cima e abas |
| `css/pecas.css` | Cartão, botão, campo, selo, barra |
| `css/telas.css` | Estilo de cada tela |
| `css/flutuantes.css` | Janela, dica, aviso do canto |
| `css/responsivo.css` | Celular e impressão |
| `css/entrada.css` | Tela de entrada |
| `js/app.js` | Ponto de partida da tela principal |
| `js/login.js` / `js/cliente-publico.js` | Entrada e página do cliente |
| `js/nucleo/contexto.js` | Dados que a tela inteira compartilha |
| `js/nucleo/api.js` | Carregar, gravar e sincronizar com o servidor |
| `js/ui/desenhar.js` | Refaz as contas e redesenha a aba aberta |
| `js/ui/acoes.js` | Tudo o que muda a obra (concluir, equipes…) |
| `js/ui/eventos.js` | O que cada botão e campo faz |
| `js/ui/janelas.js` | Janelas (unidade, equipe, confirmar) e avisos |
| `js/ui/esfera.js` / `grafico.js` | Esfera de pontos (logo, entrada e reserva do prédio 3D em aparelho sem WebGL) e gráfico de avanço |
| `js/ui/predio3d/forma.js` | Proporções do prédio: planta da torre dividida em partes iguais (uma por unidade), base e alturas. Sem Three.js |
| `js/ui/predio3d/cena.js` | Prédio 3D com Three.js: volumes, cores por unidade, giro automático, arrastar, zoom, etiqueta e clique no pavimento |
| `js/ui/predio3d/index.js` | Carrega o 3D só na aba Acompanhamento; se falhar, usa a esfera |
| `js/ui/tabela-cliente.js` | Tabela de pavimentos (aba Cliente e página pública) |
| `js/ui/telas/*.js` | Uma tela por arquivo (acompanhamento, cronograma, equipes, simulador, pagamentos, cliente, atividades, configurações) |
| `js/ui/telas/pagamentos.js` | Aba Pagamentos: tabela equipe × mês, como cada equipe é paga, valores do contrato e o extrato da equipe (a folha que vira PDF) |
| `js/ui/formato.js` | Formatos de tela: selo de atraso, dias por apto, data e hora em Fortaleza, "Marcado por…" |

## Testes (`testes/`)
`npm test` roda `previsao.test.js` (contas), `pagamentos.test.js` (regra do mês, percentual, valor fixo, pendências, obra antiga), `atividades.test.js` (textos do registro e carimbo) e `servidor.test.js` (login, usuários, gravação, registro, link do cliente).

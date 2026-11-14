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
| O que o cliente vê e o texto do WhatsApp | `src/compartilhado/cliente.js` |
| Cores, sombras, fontes | `src/publico/css/tokens.css` |
| Visual de uma tela | `src/publico/css/telas.css` |
| Conteúdo de uma tela | `src/publico/js/ui/telas/<tela>.js` |
| O que um botão faz | `src/publico/js/ui/eventos.js` e `acoes.js` |
| Senha e tempo de acesso | `src/servidor/autenticacao.js` |
| Como e onde os dados são gravados | `src/servidor/armazenamento.js` |

## Lógica (`src/compartilhado/`)
| Arquivo | O que faz |
|---|---|
| `datas.js` | Contas e formatos de data, plural, números |
| `estado-padrao.js` | Obra nova (valores iniciais) e conferência do formato dos dados |
| `calendario.js` | Transforma dias trabalhados em turnos (manhã/tarde) |
| `previsao.js` | Motor: ritmo de cada equipe, distribuição das unidades, previsão, simulador, indicadores |
| `cliente.js` | Previsão por pavimento para o cliente, com margem de segurança |
| `exemplo.js` | Obra fictícia do "modo exemplo" |

## Servidor (`src/servidor/`)
| Arquivo | O que faz |
|---|---|
| `index.js` | Liga o servidor |
| `app.js` | Rotas: páginas, `/api/login`, `/api/estado`, `/api/cliente/...`, `/saude` |
| `autenticacao.js` | Senha única, cookie de 90 dias, limite de 5 erros em 15 min |
| `armazenamento.js` | Grava `obra.json` no Volume, controla versão (dois aparelhos) e a cópia diária |
| `config.js` | Variáveis de ambiente e "que dia é hoje" no fuso da obra |

## Tela (`src/publico/`)
| Arquivo | O que faz |
|---|---|
| `index.html` / `login.html` / `cliente.html` | Página principal, entrada e página pública do cliente |
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
| `js/ui/esfera.js` / `grafico.js` | Esfera de pontos e gráfico de avanço |
| `js/ui/tabela-cliente.js` | Tabela de pavimentos (aba Cliente e página pública) |
| `js/ui/telas/*.js` | Uma tela por arquivo |

## Testes (`testes/`)
`npm test` roda `previsao.test.js` (contas) e `servidor.test.js` (senha, gravação, link do cliente).

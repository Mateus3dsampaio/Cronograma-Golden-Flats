# Colocar no ar no Railway

Leva uns 10 minutos. São 4 passos, todos no site do Railway.

## 1. Criar o serviço
1. No Railway: **New Project > Deploy from GitHub repo**.
2. Escolha o repositório **Cronograma-Golden-Flats** (branch `main`).
3. Espere a primeira publicação terminar.

## 2. Criar o Volume (onde os dados ficam guardados)
**Sem este passo, tudo o que você marcar some a cada publicação.**
1. Clique com o botão direito no serviço > **Attach Volume** (ou **+ New > Volume** e ligue ao serviço).
2. Em **Mount path** escreva: `/dados`
3. Confirme. O Railway publica de novo sozinho.

O sistema acha o Volume sozinho. Se ele não existir, aparece um aviso vermelho no topo da tela de Acompanhamento.

## 3. Definir a senha do administrador
1. No serviço, aba **Variables > New Variable**.
2. Nome: `SENHA`   Valor: a senha que você quiser (use uma senha forte, o endereço é público).
3. Salve. O Railway publica de novo.

O administrador entra com o usuário **Mateus** e essa senha. Para trocar a senha depois, mude o valor aqui: todos os aparelhos (de todos os usuários) precisam entrar de novo.

## 4. Gerar o endereço
1. No serviço, aba **Settings > Networking > Generate Domain**.
2. Abra o endereço, digite a senha e confira os dados em **Configurações**.

## Usuários e registro de atividades
- Em **Configurações > Usuários** o administrador cria cada pessoa com nome e senha, troca a senha e remove.
- Usuários marcam conclusões, cuidam das equipes e mudam configurações. Só o administrador cria usuários, restaura backup, zera a obra e troca o link do cliente.
- Cada conclusão mostra quem marcou, com data e hora de Fortaleza. A aba **Atividades** lista tudo o que cada um fez.
- O registro é feito pelo servidor: não dá para marcar em nome de outra pessoa.

## Variáveis
| Nome | Obrigatória | Para que serve |
|---|---|---|
| `SENHA` | sim | Senha do administrador |
| `ADMIN_NOME` | não | Nome de usuário do administrador. Padrão: `Mateus` |
| `FUSO` | não | Fuso da obra (datas e horas do registro). Padrão: `America/Fortaleza` |
| `PASTA_DADOS` | não | Só se quiser guardar os dados em outro lugar que não o Volume |

## Onde os dados ficam
- No Volume: `obra.json` (a obra), `usuarios.json` (usuários, com a senha embaralhada) e `atividades.json` (registro).
- O servidor guarda uma cópia por dia na pasta `copias` do Volume (últimos 30 dias).
- Garantia extra: **Configurações > Baixar backup** baixa um arquivo que pode ser restaurado depois.

## Link do cliente
Na aba **Cliente** há um link só de leitura, sem senha, que mostra apenas a previsão dos pavimentos.
"Gerar novo link" cancela o link antigo.

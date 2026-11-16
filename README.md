# Cronograma Golden Flats

Acompanhamento da montagem do hotel Golden Flats (232 apartamentos + 17 halls + recepção) pela Eccellenza.
Roda no Railway: os dados ficam no servidor e aparecem iguais no celular e no computador.

- **Colocar no ar:** `docs/colocar-no-ar.md`
- **Onde fica cada coisa no código:** `docs/mapa-do-codigo.md`

## Telas
- **Acompanhamento**: situação em uma frase, % concluído, prédio em 3D que acende conforme os pavimentos avançam (gira sozinho; arraste para girar, role para aproximar, clique num pavimento para ir até ele), previsão de término, ritmo, mapa do edifício (clique na unidade para marcar como concluída, com equipe, data e manhã/tarde), gráfico de avanço e ranking das equipes.
- **Cronograma**: linha do tempo por equipe, dia dividido em manhã e tarde.
- **Equipes**: cadastrar, editar, retirar e reativar. O cronograma se refaz na hora.
- **Simulador**: quantas equipes são necessárias para terminar numa data.
- **Pagamentos**: quanto cada equipe recebe em cada mês, como cada uma é paga (percentual do valor da unidade ou valor fixo), valores do contrato e extrato por equipe em PDF.
- **Cliente**: previsão de liberação de cada pavimento, link só de leitura para o cliente, impressão e texto para WhatsApp.
- **Atividades**: registro de quem fez o quê, com data e hora de Fortaleza.
- **Configurações**: datas, dias de trabalho, feriados, apartamentos por pavimento, modelo de cada apartamento, backup e usuários (só o administrador).

## Como a previsão é calculada
- A obra é contada em turnos (manhã e tarde) dos dias trabalhados.
- Cada item tem uma meta de dias (quatro modelos de apartamento, hall e recepção); apartamento sem modelo marcado usa o prazo geral. A meta é o ponto de partida da previsão.
- A equipe que fica livre pega a próxima unidade, na ordem dos pavimentos; o hall é a última unidade de cada pavimento.
- O ritmo de cada equipe vem das conclusões marcadas (turnos trabalhados ÷ unidades). Nas primeiras unidades o planejado ainda pesa, para a previsão não oscilar demais.
- Equipe nova ou simulada entra com o ritmo médio real da obra.

## Como o pagamento é calculado
- A equipe recebe pelo que concluiu dentro do mês. Vale a data da conclusão: até o último dia entra no mês; no dia 1º já é do mês seguinte.
- Equipe fixa: 3% do valor da unidade por padrão. Terceirizada: entra "a combinar" até o Mateus preencher o percentual ou o valor fixo por unidade.
- O valor da unidade vem do contrato (quatro modelos de apartamento, hall e recepção). O modelo de cada apartamento é marcado em Configurações; apartamento sem modelo fica fora da soma e aparece como pendência.
- Todos os usuários com login veem a aba Pagamentos (decisão do Mateus em 16/11/2026).

## Valores provisórios (conferir em Configurações)
- Distribuição dos apartamentos: 11 pavimentos com 14 e 6 com 13.
- Meta de montagem por item (Configurações): 2 dias para cada modelo de apartamento, 1 para o hall e 5 para a recepção, que fica no fim da fila.
- Data de início: a próxima segunda-feira.

## Rodar no computador (para testar)
Com o Node instalado, dê dois cliques em `iniciar.bat` (ou `npm install` e `npm start`) e abra http://localhost:3000.
No computador, sem a variável `SENHA`, entra direto. Os dados ficam na pasta `dados/`.

- `npm test` roda os testes automáticos da lógica e do servidor.
- Para simular outra data: `http://localhost:3000/?hoje=2027-01-15`.

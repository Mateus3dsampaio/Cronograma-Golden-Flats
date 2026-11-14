# Cronograma Golden Flats

Acompanhamento da montagem do hotel Golden Flats (232 apartamentos + 17 halls) pela Eccellenza.

## Como usar
Abra o arquivo `index.html` no navegador (Chrome ou Edge). Não precisa instalar nada.

**Os dados ficam só no navegador onde você marcou.** Baixe o backup toda semana em Configurações > Baixar backup.

## Telas
- **Acompanhamento**: situação em uma frase, % concluído, previsão de término, ritmo, mapa do edifício (clique na unidade para marcar como concluída, com equipe, data e manhã/tarde), gráfico de avanço e ranking das equipes.
- **Cronograma**: linha do tempo por equipe, dia dividido em manhã e tarde.
- **Equipes**: cadastrar, editar, retirar e reativar equipes. O cronograma se refaz na hora.
- **Simulador**: quantas equipes são necessárias para terminar numa data.
- **Cliente**: previsão de liberação de cada pavimento, para imprimir ou copiar para o WhatsApp.
- **Configurações**: datas, dias de trabalho, feriados, apartamentos por pavimento, backup.

## Como a previsão é calculada
- A obra é contada em turnos (manhã e tarde) dos dias trabalhados.
- A equipe que fica livre pega a próxima unidade, na ordem dos pavimentos; o hall é a última unidade de cada pavimento.
- O ritmo de cada equipe vem das conclusões marcadas (turnos trabalhados ÷ unidades). Nas primeiras unidades o planejado ainda pesa, para a previsão não oscilar demais.
- Equipe nova ou simulada entra com o ritmo médio real da obra.

## Valores provisórios (conferir em Configurações)
- Distribuição dos apartamentos: 11 pavimentos com 14 e 6 com 13.
- Hall: 1 dia por equipe.
- Data de início: a próxima segunda-feira.

## Estrutura
Um arquivo só (`index.html`), sem build. O código está dividido em blocos comentados: estado e gravação, calendário, motor de previsão, ações, telas e eventos.

Para testar outra data: `index.html?hoje=2027-01-15`.

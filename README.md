# Cronograma Golden Flats

Acompanhamento da montagem do hotel Golden Flats (232 apartamentos + 17 halls) pela Eccellenza.
Roda no Railway: os dados ficam no servidor e aparecem iguais no celular e no computador.

- **Colocar no ar:** `docs/colocar-no-ar.md`
- **Onde fica cada coisa no código:** `docs/mapa-do-codigo.md`

## Telas
- **Acompanhamento**: situação em uma frase, % concluído, previsão de término, ritmo, mapa do edifício (clique na unidade para marcar como concluída, com equipe, data e manhã/tarde), gráfico de avanço e ranking das equipes.
- **Cronograma**: linha do tempo por equipe, dia dividido em manhã e tarde.
- **Equipes**: cadastrar, editar, retirar e reativar. O cronograma se refaz na hora.
- **Simulador**: quantas equipes são necessárias para terminar numa data.
- **Cliente**: previsão de liberação de cada pavimento, link só de leitura para o cliente, impressão e texto para WhatsApp.
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

## Rodar no computador (para testar)
Com o Node instalado, dê dois cliques em `iniciar.bat` (ou `npm install` e `npm start`) e abra http://localhost:3000.
No computador, sem a variável `SENHA`, entra direto. Os dados ficam na pasta `dados/`.

- `npm test` roda os testes automáticos da lógica e do servidor.
- Para simular outra data: `http://localhost:3000/?hoje=2027-01-15`.

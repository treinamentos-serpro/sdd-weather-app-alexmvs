# Especificação de Produto: Weather App

**Status:** decisões de produto registradas; os gates de lançamento ao final ainda precisam ser resolvidos antes da aprovação da v1.

## Overview

Aplicação web responsiva, mobile-first e em pt-BR para pesquisar uma cidade, consultar suas condições meteorológicas atuais e ver a previsão diária de hoje e dos quatro dias seguintes. A pessoa seleciona a localidade explicitamente; não é necessário criar conta. A fonte de dados definida é o Open-Meteo, sem API key.

**Objetivo:** permitir que a pessoa identifique rapidamente as condições do local correto e consulte temperaturas e previsão sem conversões externas.

**Público prioritário (hipótese):** pessoas que consultam o clima antes de sair. Viajantes e pessoas que planejam atividades ao ar livre são públicos secundários propostos; as hipóteses ainda não foram validadas.

**Indicador formativo de sucesso:** em teste com 5 participantes representativos, pelo menos 4 concluem sem ajuda a seleção da cidade solicitada, identificam condição e temperatura atuais e encontram a previsão do dia pedido. Esta amostra orienta descoberta e não constitui evidência estatística.

## Escopo da v1

### Etapa de desenvolvimento com mock

Antes da integração real, a tela usa dados fictícios de Salvador (Bahia).
Inicia em `idle`, com Celsius. Após dois caracteres não brancos e 300 ms,
apresenta até cinco sugestões locais válidas, com região/país; a seleção é
explícita por clique ou setas/Enter, e Escape fecha a lista. Editar o texto
invalida a seleção e os dados anteriores. O catálogo contém Salvador, Bahia,
e uma localidade homônima de teste explicitamente identificada como fictícia,
com coordenadas e dados próprios, para verificar a seleção sem cruzar cidades.
Outras buscas retornam vazio; candidatos inválidos têm mensagem distinta.

Controles de demonstração independentes de busca, condições e previsão
permitem loading, vazio, parcial, erro, timeout e sucesso. Loading é manual
até trocar o cenário ou tentar novamente; falha de uma seção não apaga outra.
Retry restaura apenas a operação correspondente, preservando a consulta e a
cidade. Não há rede, geolocalização nem persistência. Aviso prévio esclarece
isso; conteúdo futuro de compartilhamento/atribuição depende do gate T-22,
que permanece pendente, assim como integração real e validações manuais.

### Incluído

- Busca de cidades por nome com sugestões enquanto a pessoa digita, seleção explícita de resultado e desambiguação por região e país quando disponíveis.
- Condições atuais e cinco entradas de previsão diária, conforme RF-02 e RF-03.
- Alternância entre Celsius e Fahrenheit para todas as temperaturas exibidas.
- Estados de carregamento, vazio, dados parciais, erro e timeout, com possibilidade de tentar novamente.

### Fora de escopo

- Geolocalização automática, alertas meteorológicos, favoritos, histórico de cidades e previsão horária.
- Cadastro, autenticação, aplicativo nativo, PWA e persistência de dados no servidor.
- Persistência local de cidade ou unidade, cache, funcionamento offline e atualização em segundo plano.
- Busca por código postal ou por grafias alternativas; a busca desta versão é por nome de cidade.
- Mapas, recomendações ou análises além dos campos definidos nesta especificação.

## Requisitos funcionais

- **RF-01 — Buscar e selecionar cidades:** aceitar busca por nome de cidade e apresentar sugestões enquanto a pessoa digita. Iniciar a busca após pelo menos 2 caracteres não brancos e 300 ms sem digitação; cancelar ou ignorar respostas de consultas anteriores quando o texto mudar. Apresentar no máximo 5 resultados válidos, na ordem retornada pelo serviço, preservando a grafia recebida. A seleção é sempre explícita; não selecionar automaticamente. Identificar cada resultado pelo nome da cidade e, quando fornecidos, região administrativa e país. Não permitir selecionar um resultado sem nome de cidade ou coordenadas geográficas finitas dentro dos intervalos inclusivos de latitude −90° a 90° e longitude −180° a 180°. Não persistir cidade ou unidade entre sessões.
- **RF-02 — Consultar condições atuais:** após selecionar uma cidade, apresentar temperatura, condição meteorológica em rótulo legível em pt-BR, umidade (%), vento (km/h), pressão (hPa) e precipitação (mm). Associar os dados à localidade selecionada e, quando fornecido pelo serviço, apresentar o horário de atualização. Código de condição desconhecido é indisponível, não deve ser interpretado ou inventado.
- **RF-03 — Consultar previsão diária:** apresentar exatamente cinco datas consecutivas: a data atual e os quatro dias seguintes no fuso horário da cidade selecionada. Para cada data, apresentar temperatura mínima e máxima, condição meteorológica em rótulo legível em pt-BR, probabilidade de chuva (%), precipitação (mm) e vento (km/h). Identificar cada entrada com sua data local. Código de condição desconhecido é indisponível, não deve ser interpretado ou inventado.
- **RF-04 — Alternar unidade de temperatura:** iniciar cada sessão em Celsius e permitir alternar entre Celsius e Fahrenheit. Aplicar a unidade selecionada a todas as temperaturas atuais e previstas, sem alterar a cidade ou os demais dados. Converter usando `°F = (°C × 9/5) + 32` e `°C = (°F − 32) × 5/9`; converter o valor de origem, não o valor já arredondado, exibir uma casa decimal e arredondar empates para longe de zero. Identificar cada valor com `°C` ou `°F`. Não persistir a escolha entre sessões.
- **RF-05 — Recuperar de falhas:** em erro ou timeout de busca, condições atuais ou previsão, informar qual operação falhou, preservar a busca ou cidade selecionada e oferecer nova tentativa. Uma falha em uma seção não deve ocultar dados válidos já carregados em outra.

## User stories

- **US-01 — Encontrar uma cidade:** Como pessoa que vai consultar o clima, quero pesquisar uma cidade pelo nome para selecionar o local relevante.
- **US-02 — Distinguir localidades:** Como pessoa que consulta cidades diferentes, quero ver região e país quando disponíveis para evitar selecionar uma cidade homônima.
- **US-03 — Consultar condições atuais:** Como pessoa que vai sair, quero ver as condições atuais para decidir como me preparar.
- **US-04 — Planejar os próximos dias:** Como pessoa que planeja atividades, quero consultar a previsão diária de cinco datas para escolher quando realizá-las.
- **US-05 — Escolher a unidade:** Como pessoa que prefere uma escala de temperatura, quero alternar entre Celsius e Fahrenheit para interpretar os valores.

## Critérios de aceite

Os critérios são a base verificável para testes de unidade, integração e fluxo de usuário. Dados de teste devem incluir respostas completas, parciais, inválidas e falhas do serviço.

### US-01 e US-02 — Busca e seleção (RF-01)

- **CA-01.1:** Dado que a pessoa digita pelo menos 2 caracteres não brancos, quando passam 300 ms sem nova digitação, então a busca de sugestões é iniciada sem exigir envio explícito e os resultados válidos são exibidos.
- **CA-01.2:** Dada uma busca cujo serviço retorna zero resultados, quando a resposta é exibida, então a interface informa que nenhuma cidade foi encontrada e permite editar ou repetir a busca.
- **CA-01.3:** Dado um resultado que contém nome, região e país, quando é exibido, então apresenta os três dados associados à mesma localidade.
- **CA-01.4:** Dados dois resultados com o mesmo nome e regiões diferentes, quando a pessoa seleciona o segundo, então a cidade selecionada e os dados meteorológicos carregados correspondem ao segundo resultado.
- **CA-01.5:** Dado um campo vazio ou composto apenas por espaços, quando a pessoa envia a busca, então nenhuma consulta é feita e a interface solicita um nome de cidade.
- **CA-01.6:** Dada uma busca com acentos, apóstrofos ou hífens que corresponde a um resultado, quando esse resultado é exibido, então sua grafia fornecida pelo serviço é preservada.
- **CA-01.7:** Dada uma localidade selecionável para a qual o serviço não fornece dados meteorológicos, quando a consulta é concluída, então a interface informa a indisponibilidade e permite buscar outra cidade.
- **CA-01.8:** Dado um resultado sem nome de cidade, latitude ou longitude finitas ou coordenadas fora dos intervalos de RF-01, quando os resultados são processados, então esse resultado não pode ser selecionado nem dispara consulta meteorológica; a interface informa que não foi possível identificar a cidade se nenhum resultado válido restar.
- **CA-01.9:** Dado um erro ou indisponibilidade do serviço de busca, quando uma consulta de sugestões falha, então a interface informa que não foi possível pesquisar, preserva o texto e oferece nova tentativa.
- **CA-01.10:** Dada uma consulta de sugestões sem resposta após 5 segundos, quando o limite é atingido, então a interface informa timeout, preserva o texto e oferece nova tentativa; uma resposta tardia não substitui o estado resultante do timeout.
- **CA-01.11:** Dado que o serviço retorna mais de 5 resultados válidos, quando as sugestões são exibidas, então aparecem somente os primeiros 5 na ordem do serviço.
- **CA-01.12:** Dado um resultado válido em sugestões, quando a pessoa não o seleciona, então nenhuma consulta meteorológica é iniciada; essa consulta só começa após seleção explícita.

### US-03 — Condições atuais (RF-02, RF-05)

- **CA-02.1:** Dada uma resposta completa com código de condição reconhecido, quando as condições atuais são exibidas, então os seis campos definidos em RF-02 aparecem com os valores recebidos, a condição é apresentada em rótulo legível em pt-BR e umidade, vento, pressão e precipitação mostram, respectivamente, %, km/h, hPa e mm.
- **CA-02.2:** Dada uma cidade selecionada, quando as condições são exibidas, então os dados e a identificação da cidade pertencem à mesma localidade selecionada.
- **CA-02.3:** Dada uma resposta em que um ou mais campos estão ausentes ou nulos, quando as condições são exibidas, então cada campo ausente é identificado como indisponível e nenhum deles é substituído por zero ou por outro valor inventado.
- **CA-02.4:** Dado um erro do serviço de condições atuais, quando ele ocorre, então a interface informa que as condições atuais falharam, mantém a cidade selecionada e oferece nova tentativa.
- **CA-02.5:** Dada uma consulta de condições atuais sem resposta após 5 segundos, quando o limite é atingido, então a interface informa timeout, mantém a cidade selecionada, oferece nova tentativa e não apresenta resposta tardia como resultado da tentativa expirada.
- **CA-02.6:** Dada uma resposta sem nenhum campo atual utilizável, quando é processada, então a interface informa que não há dados meteorológicos disponíveis e oferece nova tentativa ou nova busca; não apresenta a seção vazia como sucesso.
- **CA-02.7:** Dado um timestamp de atualização com idade superior a 1 hora, quando as condições atuais são exibidas, então não são rotuladas como atuais e a interface informa que os dados estão desatualizados.
- **CA-02.8:** Dada uma resposta sem timestamp de atualização, quando as condições atuais são exibidas, então a interface informa que o horário é desconhecido e não rotula os dados como atuais.
- **CA-02.9:** Dada uma resposta com código de condição desconhecido, quando as condições atuais são exibidas, então a condição é identificada como indisponível e nenhum rótulo é inferido.

### US-04 — Previsão diária (RF-03, RF-05)

- **CA-03.1:** Dada uma cidade com fuso horário conhecido, quando a previsão é exibida, então há exatamente cinco entradas, uma para cada data local entre hoje e o quarto dia seguinte, em ordem cronológica.
- **CA-03.2:** Dada uma resposta diária completa com código de condição reconhecido, quando cada entrada é exibida, então apresenta mínima, máxima, condição em rótulo legível em pt-BR, probabilidade de chuva em %, precipitação em mm e vento em km/h. Probabilidade aceita valores finitos entre 0 e 100 inclusive; ausente ou inválida é indisponível, nunca inferida a partir da precipitação.
- **CA-03.3:** Dados resultados homônimos com previsões distintas, quando uma localidade é selecionada, então todas as cinco entradas correspondem a essa localidade e exibem suas datas locais.
- **CA-03.4:** Dada uma resposta com campos diários ausentes ou nulos, quando a previsão é exibida, então cada campo ausente é identificado como indisponível e não recebe valor de outra data.
- **CA-03.5:** Dado um erro do serviço de previsão, quando ele ocorre, então a interface informa que a previsão falhou, mantém a cidade selecionada e oferece nova tentativa, sem ocultar condições atuais válidas.
- **CA-03.6:** Dada uma consulta de previsão sem resposta após 5 segundos, quando o limite é atingido, então a interface informa timeout, mantém a cidade selecionada, oferece nova tentativa e não apresenta resposta tardia como resultado da tentativa expirada.
- **CA-03.7:** Dada uma resposta sem uma ou mais das cinco datas, quando a previsão é exibida, então cada data esperada continua presente e seus campos são marcados como indisponíveis; dados de outra data não são deslocados para preenchê-la.
- **CA-03.8:** Dada uma data sem nenhum campo meteorológico utilizável, quando a previsão é exibida, então a data permanece visível e todos os campos dessa entrada são identificados como indisponíveis.
- **CA-03.9:** Dada uma localidade sem fuso horário utilizável, quando a previsão diária é solicitada, então a aplicação não infere as datas usando o fuso do dispositivo e informa que não foi possível determinar a previsão local.
- **CA-03.10:** Dada uma resposta com código de condição desconhecido em um ou mais dias, quando a previsão é exibida, então cada condição desconhecida é identificada como indisponível e nenhum rótulo é inferido.

### US-05 — Unidade de temperatura (RF-04)

- **CA-04.1:** Dada uma nova sessão sem escolha anterior, quando há temperaturas disponíveis, então todas são exibidas em Celsius com uma casa decimal e unidade identificada.
- **CA-04.2:** Dadas temperaturas de 20,0 °C, 10,0 °C e 20,0 °C, quando Fahrenheit é selecionado, então os valores correspondentes são exibidos como 68,0 °F, 50,0 °F e 68,0 °F.
- **CA-04.3:** Dadas temperaturas de 68,0 °F, 50,0 °F e 68,0 °F, quando Celsius é selecionado, então os valores correspondentes são exibidos como 20,0 °C, 10,0 °C e 20,0 °C.
- **CA-04.4:** Dadas temperaturas atuais e previstas, quando a unidade é alternada, então todos os valores mudam para a unidade escolhida sem nova busca e sem alterar os valores não relacionados à temperatura.
- **CA-04.5:** Dada uma nova sessão, quando a preferência não foi persistida, então a unidade inicial é Celsius.

## Requisitos não funcionais

- **RNF-01 — Responsividade e compatibilidade:** as tarefas principais devem funcionar sem rolagem horizontal em viewports com largura a partir de 320 px. Suportar as duas versões estáveis mais recentes de Chrome, Edge, Firefox e Safari; no mobile, as duas versões estáveis mais recentes de Safari para iOS e Chrome para Android.
- **RNF-02 — Acessibilidade:** conformidade WCAG 2.2 nível AA. Busca, sugestões, seleção, alternância de unidade, mensagens de erro e nova tentativa devem ser utilizáveis por teclado, com foco visível, nome acessível e estado anunciado por tecnologia assistiva. Validar contraste e ordem de foco por verificação automatizada e revisão manual dos fluxos principais com teclado e leitor de tela.
- **RNF-03 — Desempenho:** em janela móvel de 30 dias, o p95 de pelo menos 100 consultas ponta a ponta bem-sucedidas deve ser ≤ 3 segundos, medidos do envio da busca até a renderização das condições atuais e da previsão. O tempo do Open-Meteo está incluído; consultas que excedem 5 segundos são timeouts e não contam como sucesso.
- **RNF-04 — Atualidade e transparência:** somente dados atuais com timestamp de até 1 hora de idade podem ser rotulados como atuais. Dados sem timestamp ou com mais de 1 hora não podem receber esse rótulo; mostrar o horário quando fornecido e explicar quando estiver ausente ou desatualizado.
- **RNF-05 — Resiliência:** cada operação de busca, condições atuais e previsão tem limite de 5 segundos. Falhas e timeouts devem ser distinguíveis de resultado vazio, preservar contexto e oferecer nova tentativa. Uma resposta de uma operação não deve apagar resultado válido de outra.
- **RNF-06 — Disponibilidade:** pelo menos 99,5% das verificações sintéticas devem concluir com sucesso em cada mês calendário. Executar uma verificação por minuto que pesquise uma cidade de teste conhecida, selecione um resultado e consulte condições atuais e previsão; cada verificação agendada compõe o denominador, e falhas do Open-Meteo contam como falha.
- **RNF-07 — Segurança e privacidade:** todo tráfego deve usar HTTPS. Não exigir conta nem persistir dados no servidor na v1. Não solicitar localização do dispositivo. Qualquer coleta adicional deve ter finalidade aprovada, ser minimizada e ser informada antes do lançamento.

## Matriz de rastreabilidade

Os intervalos de critérios abaixo são inclusivos. Um critério pode atender mais de uma story; isso indica cobertura compartilhada, não testes duplicados.

| User Story | Requisitos funcionais | Acceptance Criteria | Requisitos não funcionais relevantes | Foco dos testes |
|---|---|---|---|---|
| US-01 — Encontrar uma cidade | RF-01, RF-05 | CA-01.1 a CA-01.12 | RNF-01, RNF-02, RNF-03, RNF-05, RNF-06, RNF-07 | Autocomplete, limite e ordem dos resultados, entrada inválida, caracteres especiais, seleção explícita, respostas concorrentes, vazio, falha e timeout. |
| US-02 — Distinguir localidades | RF-01 | CA-01.3, CA-01.4, CA-01.8, CA-01.12; CA-02.2 e CA-03.3 | RNF-01, RNF-02, RNF-03, RNF-06, RNF-07 | Identificação por cidade/região/país, rejeição de resultados inválidos e correspondência entre localidade escolhida, condições atuais e previsão. |
| US-03 — Consultar condições atuais | RF-02, RF-05 | CA-02.1 a CA-02.9; CA-01.7 | RNF-01, RNF-02, RNF-03, RNF-04, RNF-05, RNF-06, RNF-07 | Campos e unidades, localidade correta, dados parciais ou ausentes, códigos desconhecidos, timestamp, limite de atualidade, falha e timeout. |
| US-04 — Planejar os próximos dias | RF-03, RF-05 | CA-03.1 a CA-03.10 | RNF-01, RNF-02, RNF-03, RNF-05, RNF-06, RNF-07 | Cinco datas locais em ordem, fuso horário, campos e unidades, datas ausentes, dados parciais, códigos desconhecidos, falha e timeout. |
| US-05 — Escolher a unidade | RF-04 | CA-04.1 a CA-04.5 | RNF-01, RNF-02, RNF-07; RNF-04 e RNF-05 na preservação do estado dos dados atuais | Celsius inicial, conversão e arredondamento, unidade em todos os valores, ausência de nova busca, não persistência e preservação de avisos de atualidade/erro. |

### Uso na quebra de tarefas e na validação

- Vincular cada tarefa e teste aos IDs de US, CA e RNF que cobre; todos os critérios de aceite existentes estão associados na tabela.
- RNF-01 e RNF-02 exigem validação dos fluxos nas telas/navegadores suportados, automação de acessibilidade e revisão manual; testes funcionais isolados não comprovam conformidade.
- RNF-03 e RNF-06 são medições do fluxo integrado de US-01 a US-04, não metas independentes por story. Validar p95 e disponibilidade com as janelas, amostras e limiares definidos, após resolver os gates operacionais.
- RNF-04 incide diretamente em US-03. Alternar a unidade em US-05 não deve remover o aviso de dados desatualizados ou de horário desconhecido; o limite de 1 hora não é um limite de validade da previsão diária de US-04.
- RNF-05 deve ser exercitado nas operações remotas e na preservação das demais seções. A troca de unidade não cria uma nova operação remota.
- RNF-07 é transversal: verificar HTTPS, ausência de autenticação/localização do dispositivo e ausência de persistência de dados no servidor. A não persistência local é uma regra adicional da v1.
- As regras transversais também precisam de testes, mesmo quando não possuem CA próprio: resposta da seleção mais recente, distinção entre zero e indisponível e atribuição da fonte.

## Estados e regras transversais

- Mostrar carregamento enquanto cada operação está pendente; distinguir carregamento de busca, condições atuais e previsão.
- Uma falha ou timeout de uma operação não apaga resultados válidos das demais.
- Em tentativas concorrentes para cidades diferentes, somente a resposta da seleção mais recente pode atualizar a cidade e seus dados.
- Valores ausentes, nulos, inválidos ou não finitos são indisponíveis; zero é exibido quando efetivamente fornecido pelo serviço.
- Uma resposta meteorológica sem valores utilizáveis não é tratada como sucesso. Campos parciais são exibidos individualmente como indisponíveis, conforme os critérios acima.
- Não usar cache nem oferecer modo offline na v1. Não persistir cidade ou unidade entre sessões.
- Sugestões de busca são limitadas a nomes de cidade, começam após 2 caracteres não brancos e 300 ms sem digitação, mostram no máximo 5 resultados e exigem seleção explícita.
- A unidade de temperatura retorna a Celsius no início de cada sessão; nenhuma preferência é armazenada localmente.
- Atribuir a fonte conforme os termos do provedor e exibir uma nota concisa sobre cobertura e atualidade dos dados.
- Mapear códigos meteorológicos WMO documentados para rótulos em pt-BR. Código ausente ou desconhecido é indisponível; não inferir a condição.

## Premissas

- A cobertura geográfica é global apenas na medida em que localidades e dados estejam disponíveis no Open-Meteo.
- A pessoa escolhe uma localidade antes de consultar o clima; localização automática não é usada.
- Região administrativa e país podem não ser fornecidos pelo serviço; quando ausentes, não são inventados.
- As unidades não relacionadas à temperatura são fixas nesta versão: umidade em %, vento em km/h, pressão em hPa e precipitação em mm.
- A unidade inicial de temperatura é Celsius e não persiste entre sessões.
- O público prioritário continua sendo uma hipótese até a validação com usuários.

## Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Indisponibilidade, latência ou limite de uso do Open-Meteo | Busca ou dados indisponíveis; metas operacionais não atingidas | Validar termos, limites e cobertura antes do lançamento; monitorar verificações sintéticas e informar falhas. |
| Dados incompletos, desatualizados ou localidades sem cobertura | A pessoa pode interpretar dados parciais como completos ou atuais | Aplicar regras de indisponibilidade e atualização; validar localidades representativas. |
| Seleção de cidade homônima | Consulta referente a outra localidade | Exibir os atributos de desambiguação fornecidos e testar seleção entre resultados homônimos. |
| Fuso horário ausente ou incorreto | Datas de previsão enganosas | Não inferir datas com o fuso do dispositivo; testar localidades em fusos diferentes e transições de data. |
| Metas de desempenho, disponibilidade ou acessibilidade não atingidas | Qualidade não mensurável ou barreiras de uso | Medir os limiares definidos nesta spec e corrigir falhas antes do lançamento. |
| Termos, custos ou licenças incompatíveis com o uso | Interrupção do serviço ou exposição a custos não previstos | Revisar licença, limites, custos e condições de uso com o provedor antes do lançamento. |
## Decisões em aberto e gates de lançamento

Estes itens exigem validação externa ou definição de responsáveis; não devem ser presumidos pelo plano ou pela implementação.

1. **P0 — Provedor:** validar cobertura, licença, atribuição obrigatória, limites, custos e condições de uso do Open-Meteo para a demanda prevista; substituir o provedor se os termos não forem compatíveis.
2. **P0 — Operação:** nomear a equipe responsável por monitoramento e incidentes e definir o ambiente/local de execução das verificações sintéticas de RNF-06.
3. **P1 — Semântica dos dados:** confirmar na documentação do provedor os campos de precipitação atual e diária, o timestamp que representa a atualização atual e a tabela de códigos WMO. Atualizar RF-02/RF-03/RNF-04 se a fonte não oferecer os dados ou semântica exigidos.

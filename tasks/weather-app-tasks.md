# Backlog de Tarefas — Weather App

Tarefas derivadas de [weather-app-plan.md](../plans/weather-app-plan.md) e rastreadas à especificação [weather-app-spec.md](../specs/weather-app-spec.md). A ordem dentro de cada entrega respeita as dependências; os gates de lançamento não devem ser considerados aprovados sem evidência registrada.

## Matriz de rastreabilidade dos requisitos funcionais

| Requisito da spec | Tarefas de implementação | Tarefas de teste/validação | Lacuna |
| --- | --- | --- | --- |
| RF-01 — Buscar e selecionar cidades | T-02, T-06, T-11, T-14, T-18, T-37 | T-05, T-07, T-13, T-19, T-20, T-21, T-46 | Nenhuma |
| RF-02 — Consultar condições atuais | T-08, T-12, T-15, T-18, T-24, T-37, T-38 | T-10, T-13, T-20, T-21, T-26, T-31, T-32, T-46 | Nenhuma |
| RF-03 — Consultar previsão diária | T-03, T-09, T-12, T-16, T-18, T-24, T-25 | T-20, T-27, T-28, T-30, T-32, T-33, T-21 | Nenhuma |
| RF-04 — Alternar unidade de temperatura | T-04, T-12, T-15, T-16, T-17, T-18 | T-13, T-20, T-29, T-31, T-32, T-34, T-45 | Nenhuma |
| RF-05 — Recuperar de falhas | T-06, T-08, T-09, T-11, T-12, T-18, T-37, T-38 | T-07, T-10, T-13, T-21, T-46 | Nenhuma |

Todos os requisitos funcionais RF-01 a RF-05 têm tarefas de implementação e tarefas de teste correspondentes. Não foi identificada lacuna de cobertura funcional no backlog.

## Prioridade, tamanho e sequência sugerida

**Prioridade:** P0 bloqueia o primeiro fluxo visível ou é um gate obrigatório; P1 completa requisitos funcionais da v1; P2 é hardening posterior à primeira fatia, mas continua obrigatório quando associado a requisito ou gate de lançamento. **Tamanho:** P pequeno, M médio, G grande, estimado relativamente a este backlog (complexidade, integração e validação), não em horas.

### Fatia 1 — Busca de cidade visível
Implementar tipos, validação, gate do provedor, geocoding, hook de busca e estados; compor busca e seleção na tela. Entregar após T-47 e validar com T-48. Ordem: T-01, T-22, T-02, T-06, T-11, T-36, T-37, T-38, T-39, T-14, T-47, T-48.

### Fatia 2 — Clima completo
Adicionar condições atuais, previsão de cinco dias e unidade; completar a integração e os testes de domínio, services, hook, componentes e fluxo principal. Ordem: T-03, T-25, T-04, T-24, T-08, T-09, T-12, T-15, T-16, T-17, T-18; depois T-05, T-26 a T-35, T-13, T-45, T-20 a T-21 e T-40.

### Fatia 3 — Prontidão de lançamento
Fechar acessibilidade manual, compatibilidade, desempenho, sintéticos e operação: T-23, T-41, T-42, T-43 e T-44. P2 não significa dispensável: gates P0/P1 e metas da spec precisam estar resolvidos antes do lançamento.

## Entrega 1 — Tipos

### T-01 — Definir os tipos internos do domínio [P0/M]
- **Descrição:** Criar os contratos compartilhados de cidade, campos disponíveis, condições atuais, previsão, unidade, estados de operação e erros.
- **Critérios de aceite:** O arquivo exporta `Unit`, `City`, `WeatherField<T>`, `CurrentWeather`, `ForecastDay`, `WeatherData`, `OperationStatus`, `SectionState<T>`, `WeatherError` e `WeatherState`; `WeatherField<T>` distingue disponível/indisponível e `WeatherError` distingue rede, HTTP, resposta inválida e timeout; `tsc --noEmit` passa em modo strict.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `src/types/weather.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-01 a RF-05; CA-01.8, CA-02.3, CA-03.4; RNF-05.

## Gate prévio — Provedor

### T-22 — Resolver gates do provedor e semântica dos dados [P0/G]
- **Descrição:** Registrar evidências para os gates P0/P1 do plano antes de incorporar atribuição, aviso e interpretação dos campos na experiência.
- **Critérios de aceite:** Um registro contém, para cobertura, licença, atribuição, limites/custos, termos, retenção/tratamento, aviso/consentimento, precipitação, timestamp e WMO: decisão, fonte oficial consultada, URL e data da consulta; cada item termina como confirmado, não confirmado ou incompatível; item P0/P1 não confirmado ou incompatível fica marcado como bloqueador de lançamento e registra a ação necessária.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `plans/weather-app-plan.md`, documentação de produto/privacidade a definir
- **Tipo:** Infra
- **Rastreabilidade:** RF-02, RF-03; RNF-04, RNF-07; gates P0/P1 do plano.

## Entrega 2 — Funções puras

### T-02 — Implementar validação de localidades [P0/P]
- **Descrição:** Criar funções puras para validar nome e coordenadas e filtrar sugestões válidas.
- **Critérios de aceite:** Nome vazio, latitude/longitude não finitas ou fora dos intervalos inclusivos [-90, 90] e [-180, 180] são rejeitados; valores exatamente nos limites são aceitos; uma lista de entrada com resultados inválidos intercalados retorna os cinco primeiros válidos na ordem original, ou menos se houver menos de cinco.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/validation.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-01; CA-01.8, CA-01.11.

### T-03 — Calcular datas locais da previsão [P1/M]
- **Descrição:** Criar função pura para obter as cinco datas consecutivas no fuso IANA da cidade.
- **Critérios de aceite:** Para um instante fixo e um fuso IANA válido, a função retorna exatamente cinco strings `YYYY-MM-DD` consecutivas começando pela data local desse fuso; para fuso ausente/inválido, retorna `null` e não consulta o fuso do dispositivo.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/dates.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-03; CA-03.1, CA-03.7, CA-03.9.

### T-25 — Formatar datas para apresentação [P1/P]
- **Descrição:** Criar função pura para apresentar uma data local em pt-BR sem alterar sua data-calendário.
- **Critérios de aceite:** Para entradas `YYYY-MM-DD`, o resultado exibe dia, mês e ano correspondentes em pt-BR; casos próximos à meia-noite UTC mantêm os mesmos componentes de calendário da entrada.
- **Dependências:** T-01, T-03.
- **Arquivos prováveis:** `src/lib/format.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-03; CA-03.1.

### T-04 — Implementar conversão e formatação de temperatura [P1/M]
- **Descrição:** Criar conversão a partir do valor de origem em Celsius e apresentação com uma casa decimal e unidade explícita.
- **Critérios de aceite:** A conversão usa `F = C * 9 / 5 + 32` e `C = (F - 32) * 5 / 9`; a saída tem uma casa decimal, empate é arredondado para longe de zero e a unidade é `°C` ou `°F`; conversões recebem sempre o valor original, não a saída formatada.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/temperature.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-04; CA-04.1 a CA-04.5.

### T-24 — Implementar mapeamento de códigos WMO [P1/P]
- **Descrição:** Mapear códigos meteorológicos documentados para rótulos legíveis em pt-BR.
- **Critérios de aceite:** Cada código da tabela WMO confirmada em T-22 retorna exatamente o rótulo pt-BR registrado; código ausente, não numérico ou fora da tabela retorna indisponível, sem rótulo inferido.
- **Dependências:** T-01, T-22.
- **Arquivos prováveis:** `src/lib/weatherCodes.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-02, RF-03; CA-02.9, CA-03.10.

## Entrega 3 — Services

### T-06 — Implementar serviço de geocoding [P0/M]
- **Descrição:** Consultar a API de geocoding, validar e adaptar resultados para `City`, preservando grafia e ordem.
- **Critérios de aceite:** A URL do endpoint contém `name`, `count=100`, `language=pt` e `format=json`; resposta com candidatos inválidos retorna até cinco cidades válidas na ordem recebida; lista ausente/vazia retorna zero resultados; HTTP não-2xx, erro do provedor, JSON inválido, rejeição de rede, abort e timeout de 5 s produzem erros/estados distintos de lista vazia.
- **Dependências:** T-01, T-02, T-22.
- **Arquivos prováveis:** `src/services/geocodingService.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-01, RF-05; CA-01.2, CA-01.3, CA-01.6, CA-01.8, CA-01.9 a CA-01.11; RNF-05.

### T-08 — Implementar serviço de condições atuais [P1/M]
- **Descrição:** Consultar e mapear os campos atuais, validando individualmente valores, unidades e timestamp.
- **Critérios de aceite:** A URL usa latitude/longitude selecionadas, campos `current` e unidades definidas no plano; uma fixture com todos os campos retorna os valores e unidades correspondentes; `null`, ausente, não finito ou WMO desconhecido vira indisponível, enquanto zero permanece zero; HTTP/API, JSON/estrutura inválida, rede, abort e timeout em 5 s são distinguíveis; timestamp ausente/inválido não é classificado como atual.
- **Dependências:** T-01, T-24, T-22.
- **Arquivos prováveis:** `src/services/weatherService.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-02, RF-05; CA-02.1 a CA-02.9; RNF-04, RNF-05.

### T-09 — Implementar serviço de previsão diária [P1/G]
- **Descrição:** Consultar previsão e produzir exatamente cinco dias locais, sem deslocar valores entre datas quando arrays estiverem incompletos.
- **Critérios de aceite:** A URL usa as coordenadas selecionadas, parâmetros de unidades, `forecast_days=5` e `timezone=auto`; fixture com arrays desalinhados/incompletos conserva cinco datas esperadas e não transfere valores entre índices/datas; timezone ausente/inválido não usa timezone do dispositivo; HTTP/API, estrutura inválida, rede, abort e timeout em 5 s retornam falha da previsão.
- **Dependências:** T-01, T-03, T-24, T-25, T-22.
- **Arquivos prováveis:** `src/services/weatherService.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-03, RF-05; CA-03.1 a CA-03.10; RNF-05.

## Entrega 4 — Hook

### T-11 — Implementar busca, debounce e seleção explícita [P0/M]
- **Descrição:** Criar a parte de busca do hook, coordenando texto, sugestões, debounce, retry e seleção da cidade.
- **Critérios de aceite:** Com relógio falso, 1 caractere não inicia busca; 2 caracteres não brancos iniciam exatamente após 300 ms; texto vazio/espaços não chama serviço; editar antes do prazo cancela o timer e invalida resposta anterior; retry reutiliza o texto atual; selecionar resultado é a única ação que inicia forecast; resposta antiga não altera sugestões/status atuais.
- **Dependências:** T-01, T-06.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-01, RF-05; CA-01.1, CA-01.2, CA-01.5, CA-01.9, CA-01.10, CA-01.12; RNF-05, RNF-07.

### T-12 — Implementar carregamentos independentes de clima [P1/G]
- **Descrição:** Completar o hook com seleção de cidade, condições atuais, previsão, unidade e retries por seção.
- **Critérios de aceite:** Selecionar uma cidade chama os serviços atual e diário uma vez cada antes de resolver qualquer um; troca de cidade limpa os dois dados anteriores; cada operação alcança `loading` e seu status final sem alterar o status da outra; retry chama somente o serviço da seção solicitada; timeout/cancelamento e resposta atrasada não atualizam estado; unidade inicial é Celsius e alterná-la não chama serviços.
- **Dependências:** T-08, T-09, T-11.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-02 a RF-05; CA-01.4, CA-01.7, CA-02.2, CA-02.4 a CA-02.8, CA-03.3, CA-03.5, CA-03.6, CA-04.4, CA-04.5; RNF-04, RNF-05.

## Entrega 5 — Componentes

### T-36 — Construir estado de carregamento [P0/P]
- **Descrição:** Implementar apresentação acessível e reutilizável do estado loading.
- **Critérios de aceite:** O componente renderiza indicador com role `status` e texto acessível não vazio; teste de componente confirma role/texto; altura/largura do contêiner não muda entre renderização sem conteúdo e loading.
- **Dependências:** T-11, T-12.
- **Arquivos prováveis:** `src/components/states/LoadingState.tsx`
- **Tipo:** UI
- **Rastreabilidade:** RF-01 a RF-05; RNF-02.

### T-37 — Construir estado vazio [P0/P]
- **Descrição:** Implementar mensagens acessíveis para busca sem resultados e dados meteorológicos indisponíveis.
- **Critérios de aceite:** `empty` de geocoding renderiza “nenhuma cidade encontrada”; resultados recebidos, mas todos inválidos, renderizam mensagem distinta de “não foi possível identificar a cidade”; erro/timeout não renderiza nenhuma dessas mensagens; indisponibilidade meteorológica tem mensagem distinta; nenhuma mensagem cria opção selecionável; editar/repetir invoca o callback correspondente uma vez.
- **Dependências:** T-11, T-12.
- **Arquivos prováveis:** `src/components/states/EmptyState.tsx`
- **Tipo:** UI
- **Rastreabilidade:** RF-01, RF-02; CA-01.2, CA-01.8, CA-01.9, CA-01.7, CA-02.6; RNF-02.

### T-38 — Construir estado de erro e retry [P0/P]
- **Descrição:** Implementar mensagem de erro reutilizável com ação de retry acessível.
- **Critérios de aceite:** Para props `operation=search`, `current` e `forecast`, em `error` e `timeout`, o texto identifica a operação correspondente; clique e teclado chamam uma vez o callback de retry recebido e não chamam callbacks de outras operações.
- **Dependências:** T-11, T-12.
- **Arquivos prováveis:** `src/components/states/ErrorState.tsx`
- **Tipo:** UI
- **Rastreabilidade:** RF-05; CA-01.9, CA-01.10, CA-02.4, CA-02.5, CA-03.5, CA-03.6; RNF-02, RNF-05.

### T-39 — Construir aviso de compartilhamento e atribuição [P0/M]
- **Descrição:** Implementar componente com aviso prévio sobre os dados enviados e atribuição/notas da fonte confirmadas no gate do provedor.
- **Critérios de aceite:** Antes de qualquer ação de busca, a tela exibe texto que identifica o nome digitado e as coordenadas selecionadas como dados enviados à Open-Meteo; a atribuição corresponde literalmente à decisão registrada em T-22; o teste falha se o texto afirmar política de retenção sem fonte confirmada.
- **Dependências:** T-22.
- **Arquivos prováveis:** `src/components/DataDisclosure.tsx`
- **Tipo:** UI
- **Rastreabilidade:** RNF-02, RNF-07.

### T-14 — Construir busca e sugestões acessíveis [P0/M]
- **Descrição:** Implementar o campo de busca, a lista de sugestões e a seleção explícita.
- **Critérios de aceite:** O campo tem label acessível; resultados são expostos como opções com nome e, quando existentes, região/país; ArrowDown/ArrowUp alteram a opção ativa, Enter seleciona a opção ativa e Escape fecha a lista; clique seleciona a opção clicada; edição e seleção chamam callbacks com os valores exatos.
- **Dependências:** T-11.
- **Arquivos prováveis:** `src/components/SearchBar.tsx`
- **Tipo:** UI
- **Rastreabilidade:** RF-01; CA-01.1, CA-01.3, CA-01.4, CA-01.6, CA-01.12; RNF-02.

### T-15 — Construir apresentação das condições atuais [P1/M]
- **Descrição:** Exibir identificação da cidade, campos atuais disponíveis e estado de atualização.
- **Critérios de aceite:** Com fixture completa, renderiza os seis campos RF-02 e unidades `%`, `km/h`, `hPa`, `mm` e a unidade de temperatura recebida; campo indisponível exibe o marcador especificado de indisponibilidade e nunca `0`; timestamp ausente exibe horário desconhecido e idade superior a 1 h exibe aviso de desatualização, sem texto “atual”.
- **Dependências:** T-12, T-04.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`
- **Tipo:** UI
- **Rastreabilidade:** RF-02; CA-02.1 a CA-02.3, CA-02.7 a CA-02.9; RNF-02, RNF-04.

### T-16 — Construir lista e cartões da previsão [P1/G]
- **Descrição:** Exibir as cinco datas locais, valores meteorológicos e indisponibilidades por campo/dia.
- **Critérios de aceite:** Para uma fixture de previsão, renderiza exatamente cinco itens na ordem recebida; cada item contém mínima, máxima, condição, precipitação e vento com unidades; dia/campo sem dado permanece no item e exibe marcador de indisponibilidade; erro/timeout mostra retry da previsão e não remove a seção de condições atuais.
- **Dependências:** T-12, T-03, T-04, T-25.
- **Arquivos prováveis:** `src/components/ForecastList.tsx`, `src/components/ForecastCard.tsx`
- **Tipo:** UI
- **Rastreabilidade:** RF-03, RF-05; CA-03.1 a CA-03.10; RNF-01, RNF-02.

### T-17 — Construir controle de unidade [P1/P]
- **Descrição:** Implementar o controle acessível e controlado de unidade Celsius/Fahrenheit.
- **Critérios de aceite:** O controle tem nome acessível, expõe exatamente Celsius/Fahrenheit e o estado selecionado, permite mudar seleção por teclado e chama o callback uma vez com a unidade escolhida; quando recebe Celsius inicial, Celsius está selecionado.
- **Dependências:** T-01, T-12, T-04.
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`
- **Tipo:** UI
- **Rastreabilidade:** RF-04; CA-04.1, CA-04.5; RNF-02.

## Entrega 6 — Integração

### T-47 — Integrar a primeira fatia de busca e seleção [P0/M]
- **Descrição:** Compor `App` com o hook de busca, campo, sugestões, estados e cidade selecionada, antes de integrar as seções meteorológicas.
- **Critérios de aceite:** A tela renderiza o campo e estados de busca; selecionar uma sugestão atualiza a localidade exibida sem selecionar automaticamente; editar a consulta limpa/invalida a seleção anterior; aviso de compartilhamento aparece antes da busca.
- **Dependências:** T-11, T-14, T-36, T-37, T-38, T-39.
- **Arquivos prováveis:** `src/App.tsx`
- **Tipo:** UI
- **Rastreabilidade:** RF-01; CA-01.1 a CA-01.6, CA-01.8 a CA-01.12; RNF-02, RNF-07.

### T-48 — Testar a primeira fatia de busca em E2E [P0/M]
- **Descrição:** Validar no navegador a busca e seleção explícita com geocoding interceptado.
- **Critérios de aceite:** Playwright digita uma cidade, aguarda sugestões, seleciona uma opção e verifica a localidade selecionada; nenhuma consulta de clima ocorre antes da seleção; o teste passa em viewport desktop e mobile.
- **Dependências:** T-47.
- **Arquivos prováveis:** `tests/e2e/weather-search-slice.spec.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-01; CA-01.1, CA-01.3, CA-01.4, CA-01.12; RNF-01, RNF-02.

### T-18 — Integrar a tela e divulgar fonte/compartilhamento [P1/G]
- **Descrição:** Completar a integração da SPA iniciada em T-47, adicionando clima atual, previsão e alternância de unidade.
- **Critérios de aceite:** `App` conecta o hook a condições atuais, previsão e unidade além da busca existente; renderiza loading/vazio/erro/parcial de cada operação a partir do status correspondente, sem cruzar estados entre seções; não solicita geolocalização nem persiste cidade/unidade.
- **Dependências:** T-47, T-12, T-15, T-16, T-17.
- **Arquivos prováveis:** `src/App.tsx`
- **Tipo:** UI
- **Rastreabilidade:** RF-01 a RF-05; RNF-01, RNF-02, RNF-07.

## Entrega 7 — Testes

### T-05 — Testar validação de localidades [P1/P]
- **Descrição:** Cobrir validação de nome, coordenadas e limite/ordem das sugestões.
- **Critérios de aceite:** Testes passam para latitude -90/90 e longitude -180/180, rejeitam valores imediatamente fora dos intervalos e `NaN`/infinito, rejeitam nome vazio e verificam que seis resultados válidos intercalados com inválidos retornam os cinco primeiros válidos na ordem de entrada.
- **Dependências:** T-02, T-18.
- **Arquivos prováveis:** `tests/unit/lib/validation.test.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-01; CA-01.8, CA-01.11.

### T-26 — Testar mapeamento WMO [P1/P]
- **Descrição:** Cobrir códigos WMO conhecidos, ausentes e desconhecidos.
- **Critérios de aceite:** Para cada código da tabela confirmada, o teste compara o retorno à string pt-BR registrada; casos de `null`, ausência e código desconhecido comparam o retorno ao estado indisponível.
- **Dependências:** T-24, T-18.
- **Arquivos prováveis:** `tests/unit/lib/weatherCodes.test.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-02, RF-03; CA-02.9, CA-03.10.

### T-27 — Testar cálculo de datas locais [P1/M]
- **Descrição:** Cobrir sequência de cinco datas e tratamento de fusos inválidos.
- **Critérios de aceite:** Com relógio fixo, testes verificam cinco datas consecutivas em pelo menos dois fusos que estejam em dias locais diferentes; timezone ausente e inválido retornam indisponibilidade e nenhum teste depende do timezone configurado no runner.
- **Dependências:** T-03, T-18.
- **Arquivos prováveis:** `tests/unit/lib/dates.test.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-03; CA-03.1, CA-03.7, CA-03.9.

### T-28 — Testar formatação de datas [P2/P]
- **Descrição:** Verificar apresentação pt-BR sem deslocamento da data-calendário.
- **Critérios de aceite:** Para datas de entrada que representem dias distintos em UTC e no timezone do runner, a saída contém o dia/mês/ano da data de entrada; testes também verificam locale pt-BR configurado.
- **Dependências:** T-25, T-18.
- **Arquivos prováveis:** `tests/unit/lib/format.test.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-03; CA-03.1.

### T-29 — Testes unitários de conversão de unidade [P1/P]
- **Descrição:** Testar unitariamente conversões, precisão, sufixos e arredondamento.
- **Critérios de aceite:** Vitest verifica 20 °C → 68,0 °F, 10 °C → 50,0 °F, 68 °F → 20,0 °C, um caso de empate positivo e um negativo arredondados para longe de zero, uma casa decimal e os sufixos `°C`/`°F`.
- **Dependências:** T-04, T-18.
- **Arquivos prováveis:** `tests/unit/lib/temperature.test.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-04; CA-04.1 a CA-04.5.

### T-07 — Testar serviço de geocoding com mock de fetch [P0/M]
- **Descrição:** Testar requisição, validação e falhas do geocoding substituindo `fetch` por mock.
- **Critérios de aceite:** Testes verificam URL/parâmetros codificados, filtragem/ordem/limite de cinco, resposta vazia, HTTP não-2xx, erro explícito da API, JSON inválido, rejeição de rede, sinal abortado e timeout; em cada falha o teste espera rejeição/erro, nunca `[]`; o mock recebe exatamente uma chamada de geocoding e nenhuma chamada de forecast.
- **Dependências:** T-06, T-18.
- **Arquivos prováveis:** `tests/unit/services/geocodingService.test.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-01, RF-05; CA-01.1, CA-01.2, CA-01.8 a CA-01.11; RNF-05.

### T-10 — Testar serviço de condições atuais com mock de fetch [P1/M]
- **Descrição:** Testar requisição e mapeamento das condições atuais substituindo `fetch` por mock.
- **Critérios de aceite:** Com `fetch` mockado, os testes verificam endpoint e parâmetros de condições atuais, os seis campos e unidades, zero mantido e ausente/nulo/não finito indisponível; verificam timestamp com idade menor/igual e maior que 1 h, ausente e inválido, HTTP/API, JSON/estrutura inválida, rede, abort e timeout de 5 s.
- **Dependências:** T-08, T-18.
- **Arquivos prováveis:** `tests/unit/services/currentWeatherService.test.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-02, RF-05; CA-02.1 a CA-02.9; RNF-04, RNF-05.

### T-30 — Testar serviço de previsão diária com mock de fetch [P1/M]
- **Descrição:** Testar requisição e mapeamento da previsão substituindo `fetch` por mock.
- **Critérios de aceite:** Com `fetch` mockado, os testes verificam endpoint e parâmetros, exatamente cinco datas, campo associado ao índice/data correto quando um índice está ausente, valores ausentes sem deslocamento, timezone válido/ausente/inválido, HTTP/API, JSON/estrutura inválida, rede, abort e timeout de 5 s.
- **Dependências:** T-09, T-18.
- **Arquivos prováveis:** `tests/unit/services/forecastService.test.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-03, RF-05; CA-03.1 a CA-03.10; RNF-05.

### T-13 — Testar hook e concorrência de operações [P1/G]
- **Descrição:** Testar debounce, cancelamento, seleção, retry e independência das operações usando serviços simulados e relógio controlado.
- **Critérios de aceite:** Testes com relógio falso verificam busca em 299/300 ms, ausência de chamada abaixo do mínimo, resposta obsoleta ignorada, troca de cidade, timeout por operação, retry de cada seção isoladamente, falha de atual preservando previsão e vice-versa, e alternância de unidade com contagem de chamadas inalterada.
- **Dependências:** T-07, T-10, T-30, T-11, T-12, T-18.
- **Arquivos prováveis:** `tests/unit/hooks/useWeather.test.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-01 a RF-05; CA-01.1, CA-01.4, CA-01.10, CA-01.12, CA-02.4, CA-02.5, CA-03.5, CA-03.6, CA-04.4; RNF-05.

### T-19 — Testar busca e seleção acessíveis [P1/M]
- **Descrição:** Testar renderização e interação do campo e das sugestões sem rede real.
- **Critérios de aceite:** Testing Library encontra o campo por label e opções por role/nome; testa setas, Enter, Escape, clique, edição, callback de seleção e apresentação de região/país quando presentes e ausentes.
- **Dependências:** T-14, T-18.
- **Arquivos prováveis:** `tests/unit/components/SearchBar.test.tsx`
- **Tipo:** Test
- **Rastreabilidade:** RF-01; CA-01.3, CA-01.4, CA-01.12; RNF-02.

### T-31 — Testar condições atuais [P1/M]
- **Descrição:** Testar conteúdo, indisponibilidades, timestamp e unidade da apresentação atual.
- **Critérios de aceite:** Testing Library verifica os seis valores/unidades da fixture, marcador de campo indisponível sem valor zero, timestamp ausente, timestamp >1 h e a mudança da temperatura ao fornecer Celsius versus Fahrenheit.
- **Dependências:** T-15, T-18.
- **Arquivos prováveis:** `tests/unit/components/CurrentWeather.test.tsx`
- **Tipo:** Test
- **Rastreabilidade:** RF-02, RF-04; CA-02.1 a CA-02.3, CA-02.7 a CA-02.9, CA-04.2 a CA-04.4.

### T-32 — Testar cartão de previsão [P1/M]
- **Descrição:** Testar os campos e a apresentação de uma data da previsão.
- **Critérios de aceite:** Testing Library verifica uma data, mínima/máxima, condição, precipitação, vento, respectivas unidades, marcador de cada campo ausente e conversão de temperatura para ambas as unidades.
- **Dependências:** T-16, T-18.
- **Arquivos prováveis:** `tests/unit/components/ForecastCard.test.tsx`
- **Tipo:** Test
- **Rastreabilidade:** RF-03, RF-04; CA-03.2, CA-03.4, CA-03.8, CA-03.10, CA-04.2 a CA-04.4.

### T-33 — Testar lista de previsão [P1/P]
- **Descrição:** Testar a composição e a ordem das cinco datas na lista.
- **Critérios de aceite:** Com cinco datas distintas fornecidas em ordem cronológica, teste confirma cinco itens renderizados na mesma ordem e cada item mantém seus próprios dados; nenhuma data ou valor é descartado ou associado a outro item.
- **Dependências:** T-16, T-18.
- **Arquivos prováveis:** `tests/unit/components/ForecastList.test.tsx`
- **Tipo:** Test
- **Rastreabilidade:** RF-03; CA-03.1, CA-03.3, CA-03.7.

### T-34 — Testar controle de unidade [P1/P]
- **Descrição:** Testar estado selecionado, acessibilidade e callback do controle.
- **Critérios de aceite:** Testing Library confirma label acessível, Celsius selecionado inicialmente, alteração por teclado e chamada única do callback com `fahrenheit` e depois `celsius`.
- **Dependências:** T-17, T-18.
- **Arquivos prováveis:** `tests/unit/components/UnitToggle.test.tsx`
- **Tipo:** Test
- **Rastreabilidade:** RF-04; CA-04.1, CA-04.5; RNF-02.

### T-35 — Testar aviso e atribuição da fonte [P1/P]
- **Descrição:** Testar conteúdo acessível do aviso de compartilhamento e da atribuição.
- **Critérios de aceite:** Testing Library encontra o aviso por texto acessível antes de interagir com a busca e confirma referências ao texto pesquisado, coordenadas e Open-Meteo; teste rejeita afirmação de retenção sem informação aprovada em T-22.
- **Dependências:** T-39, T-18.
- **Arquivos prováveis:** `tests/unit/components/DataDisclosure.test.tsx`
- **Tipo:** Test
- **Rastreabilidade:** RNF-02, RNF-07.

### T-45 — Testar composição e estados da aplicação [P1/M]
- **Descrição:** Testar a integração de `App` com hook, componentes e estados independentes.
- **Critérios de aceite:** Com hook simulado em loading, sucesso, parcial, vazio e erro, cada seção renderiza a vista correspondente sem substituir o status das outras; interação seleciona unidade e cidade por callbacks; recarregar inicia sem cidade/unidade persistidas e não solicita geolocalização.
- **Dependências:** T-18.
- **Arquivos prováveis:** `tests/unit/App.test.tsx`
- **Tipo:** Test
- **Rastreabilidade:** RF-01 a RF-05; RNF-02, RNF-07.

### T-46 — Testar componentes nos estados loading, erro e vazio [P1/M]
- **Descrição:** Testar diretamente os componentes reutilizáveis de loading, vazio e erro, sem depender da composição do App.
- **Critérios de aceite:** Testing Library verifica `LoadingState` por role `status`; `EmptyState` diferencia busca sem resultados, resultados não identificáveis e indisponibilidade meteorológica; `ErrorState` distingue `error`/`timeout` e busca/condições/previsão; ações de editar e retry chamam somente o callback correspondente uma vez por interação.
- **Dependências:** T-36, T-37, T-38, T-18.
- **Arquivos prováveis:** `tests/unit/components/states.test.tsx`
- **Tipo:** Test
- **Rastreabilidade:** RF-01, RF-02, RF-05; CA-01.2, CA-01.8 a CA-01.10, CA-02.4 a CA-02.6, CA-03.5, CA-03.6; RNF-02, RNF-05.

### Testes E2E

### T-20 — Validar fluxo principal em E2E [P1/G]
- **Descrição:** Automatizar com Playwright o percurso de busca até a consulta das condições e da previsão usando APIs interceptadas.
- **Critérios de aceite:** Com rotas Open-Meteo interceptadas, Playwright executa o fluxo em viewport desktop e mobile; em ambos seleciona a segunda de duas cidades homônimas, confirma que suas coordenadas foram enviadas, verifica a identificação, cinco datas e campos, alterna unidade e confirma que a contagem de chamadas de rede não aumentou.
- **Dependências:** T-18.
- **Arquivos prováveis:** `tests/e2e/weather-flow.spec.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-01 a RF-04; CA-01.4, CA-01.12, CA-02.2, CA-03.1, CA-03.3, CA-04.4.

### T-21 — Validar recuperação de falhas em E2E [P1/G]
- **Descrição:** Automatizar cenários integrados de vazio, parcial, erro, timeout e retry.
- **Critérios de aceite:** Rotas interceptadas simulam busca vazia/erro/timeout, erro/timeout atual, previsão parcial/erro/timeout e respostas atrasadas; cada cenário verifica mensagem/status específico, retry da operação correspondente, preservação da outra seção e que a resposta obsoleta não altera o DOM.
- **Dependências:** T-18, T-20.
- **Arquivos prováveis:** `tests/e2e/weather-errors.spec.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-01 a RF-05; CA-01.2, CA-01.9, CA-01.10, CA-02.3 a CA-02.6, CA-03.4 a CA-03.8; RNF-05.

### T-40 — Validar responsividade em E2E [P1/M]
- **Descrição:** Automatizar os fluxos principais em viewports mobile e desktop.
- **Critérios de aceite:** Playwright roda o fluxo principal em 320 px, viewport mobile comum e desktop; em cada viewport `document.documentElement.scrollWidth <= window.innerWidth`, o campo e controles principais permanecem visíveis e o fluxo termina com clima atual e cinco datas renderizados.
- **Dependências:** T-18, T-20.
- **Arquivos prováveis:** `tests/e2e/weather-responsive.spec.ts`
- **Tipo:** Test
- **Rastreabilidade:** RNF-01.

## Entrega 8 — Hardening e prontidão para lançamento

### T-23 — Executar revisão manual de acessibilidade [P2/M]
- **Descrição:** Registrar revisão manual de acessibilidade dos fluxos principais.
- **Critérios de aceite:** Relatório registra navegador/leitor de tela, data e resultado para busca, seleção, unidade, erro e retry; verifica foco visível, ordem de foco, nomes/estados anunciados e contraste mínimo de 4,5:1 para texto normal e 3:1 para texto grande; cada falha tem referência WCAG, severidade e ação, e execução automatizada não é marcada como revisão manual.
- **Dependências:** T-18, T-20, T-21.
- **Arquivos prováveis:** `docs/qa/accessibility-review.md`
- **Tipo:** Infra
- **Rastreabilidade:** RNF-02.

### T-41 — Validar matriz de navegadores [P2/G]
- **Descrição:** Executar e registrar a matriz de compatibilidade de navegadores e versões suportadas.
- **Critérios de aceite:** Relatório lista versão e resultado de execução dos fluxos principais nas duas versões estáveis mais recentes de Chrome, Edge, Firefox e Safari e nas duas versões estáveis mais recentes de Safari iOS e Chrome Android; cada combinação não executada é identificada como lacuna, cada falha tem ação registrada.
- **Dependências:** T-20, T-40.
- **Arquivos prováveis:** `docs/qa/browser-compatibility.md`
- **Tipo:** Infra
- **Rastreabilidade:** RNF-01.

### T-42 — Medir desempenho ponta a ponta [P2/M]
- **Descrição:** Medir a latência do fluxo real de busca até a renderização das duas seções.
- **Critérios de aceite:** Relatório identifica a janela móvel de 30 dias, contém pelo menos 100 consultas ponta a ponta bem-sucedidas e o p95 do tempo entre envio de busca e renderização de ambas as seções; sucesso exige ≤3 s e timeout >5 s não entra no conjunto de sucessos; resultado acima da meta registra ação corretiva.
- **Dependências:** T-20, T-22.
- **Arquivos prováveis:** `docs/operations/performance.md`
- **Tipo:** Infra
- **Rastreabilidade:** RNF-03.

### T-43 — Implementar verificação sintética do fluxo [P2/M]
- **Descrição:** Criar verificação que pesquisa uma cidade conhecida, seleciona um resultado e consulta as duas seções usando o serviço real.
- **Critérios de aceite:** Execução contra Open-Meteo sem interceptação/mock pesquisa a cidade de teste, seleciona um resultado e confirma presença de condições atuais e cinco datas; falha de qualquer etapa produz exit code diferente de zero e log identifica a etapa falha.
- **Dependências:** T-20, T-22.
- **Arquivos prováveis:** `tests/e2e/synthetic-weather.spec.ts`
- **Tipo:** Infra
- **Rastreabilidade:** RNF-06.

### T-44 — Agendar monitoramento e definir resposta operacional [P2/G]
- **Descrição:** Configurar execução sintética por minuto e registrar responsáveis e procedimento de incidente.
- **Critérios de aceite:** O ambiente operacional selecionado e documentado nesta tarefa agenda T-43 a cada minuto e registra cada execução; o documento nomeia equipe/responsável, ambiente, alerta e procedimento de incidente; cálculo mensal inclui toda execução agendada no denominador e registra sucesso/falha por execução para comparar com 99,5%; o scheduler escolhido comprova suporte a intervalo de um minuto.
- **Dependências:** T-43.
- **Arquivos prováveis:** configuração do scheduler no ambiente operacional a definir, `docs/operations/monitoring.md`
- **Tipo:** Infra
- **Rastreabilidade:** RNF-06.

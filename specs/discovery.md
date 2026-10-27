# Discovery: Aplicação de Previsão do Tempo

## Resumo executivo

- A proposta é um aplicativo web responsivo, pensado primeiro para celulares, que ajuda a consultar o clima de qualquer cidade disponível no serviço escolhido.
- Será possível ver as condições atuais e a previsão para hoje e os quatro dias seguintes, alternando entre Celsius e Fahrenheit.
- A experiência será em português do Brasil, sem cadastro, e mostrará região e país para ajudar a escolher a cidade correta.
- O público prioritário ainda é uma hipótese: pessoas que consultam o clima antes de sair; essa necessidade precisa ser validada com usuários.
- Antes do lançamento, será importante confirmar a qualidade e disponibilidade dos dados, além de definir metas de atualização, desempenho e sucesso.

## Contexto

A empresa precisa de uma aplicação web responsiva, mobile-first, para consulta rápida de informações meteorológicas de cidades. A experiência deve permitir encontrar uma cidade, consultar as condições atuais e visualizar a previsão diária de hoje mais os quatro dias seguintes. Também deve oferecer alternância entre Celsius e Fahrenheit.

Permanecem em aberto o público prioritário, os critérios de atualização dos dados e detalhes da experiência de busca. A cobertura geográfica global depende da validação do serviço de dados escolhido.

## Decisões

As decisões abaixo consolidam as escolhas fornecidas pelo solicitante e o escopo inicial adotado para o workshop. Quando uma decisão cobre apenas parte de uma pergunta, as pendências são mantidas explícitas.

1. **Fonte de dados: Open-Meteo, sem API key.**  
    **Justificativa:** permite consultar os dados meteorológicos sem gerenciar uma chave de API.  
    **Pendências:** validar cobertura para as localidades consultadas, licença, limites de uso e garantias do serviço.

2. **Período da previsão: hoje mais os quatro dias seguintes.**  
    **Justificativa:** define a janela de cinco dias de forma explícita para produto e implementação.  

3. **Unidade padrão: Celsius.**  
    **Justificativa:** estabelece uma unidade inicial consistente para a experiência.  
    **Pendências:** persistência da preferência e unidades para vento, precipitação e distância.

4. **Sem autenticação e sem persistência de servidor.**  
    **Justificativa:** evita contas de usuário e armazenamento de estado pessoal no servidor neste escopo.  
    **Perguntas endereçadas:** exclui autenticação e armazenamento server-side de cidades ou preferências, cobrindo parte da pergunta 9 e reduzindo o escopo relacionado às perguntas 21 e 22. Persistência local no navegador e requisitos de segurança além de HTTPS continuam em aberto; geolocalização automática está fora do escopo da v1.

5. **Idioma da interface: pt-BR.**  
    **Justificativa:** define o idioma da experiência apresentada ao usuário.  

6. **Plataforma: web responsiva, mobile-first.**  
    **Justificativa:** atende ao uso móvel prioritário e ao contexto React/Vite com entrega web estática do projeto.

7. **Cobertura geográfica: global, limitada às localidades disponíveis no Open-Meteo.**  
    **Justificativa:** não restringe a busca a um país; a cobertura efetiva deve ser validada para o serviço escolhido.

8. **Desambiguação de cidades: apresentar cidade, região administrativa e país nos resultados.**  
    **Justificativa:** ajuda o usuário a distinguir localidades homônimas antes de consultar a previsão.

9. **Clima atual: temperatura, condição, umidade, vento, pressão e precipitação.**

10. **Previsão: resumo diário para hoje mais os quatro dias seguintes, com mínimas e máximas, condição, precipitação e vento.**  
    **Justificativa:** estabelece o conteúdo mínimo da previsão de cinco dias para interface e critérios de aceite.

11. **Fora do escopo da v1: geolocalização automática, alertas meteorológicos, favoritos e histórico de cidades.**  
    **Justificativa:** mantém o fluxo inicial centrado em busca explícita, sem permissões de localização nem persistência de coleções de cidades.

## Personas (Hipóteses)

As personas abaixo são hipóteses iniciais derivadas do briefing e devem ser validadas com usuários antes de orientar decisões definitivas de produto.

### Quem se desloca diariamente

- **Objetivo principal:** decidir como se vestir e se precisa levar proteção contra chuva.
- **Contexto de uso:** principalmente em dispositivos móveis, antes de sair ou durante o trajeto; consulta as condições atuais.
- **Métrica de sucesso:** seleciona a cidade correta e identifica as condições atuais sem ajuda ou precisar refazer a busca.

### Quem planeja atividades

- **Objetivo principal:** escolher o melhor dia para uma atividade ao ar livre nos próximos dias.
- **Contexto de uso:** usa desktop em casa ou no trabalho para planejar e mobile para consultar novamente antes de sair.
- **Métrica de sucesso:** encontra a previsão do dia pretendido e decide se mantém ou ajusta o plano.

### Quem viaja ou consulta cidades diferentes

- **Objetivo principal:** verificar o clima de um destino e interpretar a temperatura na unidade de sua preferência.
- **Contexto de uso:** principalmente em dispositivos móveis durante a viagem; usa desktop ao pesquisar antes dela.
- **Métrica de sucesso:** seleciona a cidade correta, mesmo quando há nomes semelhantes, e entende as temperaturas sem conversões externas.

## Hipótese de público e indicador de sucesso

- **Público prioritário proposto:** pessoas que consultam o clima antes de sair para decidir como se vestir ou se precisam de proteção contra chuva, principalmente em dispositivos móveis. Esta é uma hipótese coerente com a prioridade mobile-first, ainda não validada com usuários.
- **Público secundário proposto:** pessoas que planejam atividades ao ar livre e consultam a previsão dos próximos dias.
- **Indicador candidato:** taxa de conclusão sem ajuda em um teste de tarefa. Mede a proporção de participantes representativos que selecionam a cidade solicitada, identificam corretamente condição e temperatura atuais e encontram a previsão do dia pedido, sem intervenção do moderador.
- **Validação pendente:** confirmar que o público prioritário representa a necessidade principal e definir perfil dos participantes, tamanho da amostra e taxa mínima aceitável antes de usar o indicador como critério de sucesso ou gate de lançamento.

## Requisitos Funcionais

- **RF-01 — Buscar cidades:** permitir que o usuário pesquise cidades pelo nome e selecione a cidade desejada em resultados que identifiquem cidade, região administrativa e país.
- **RF-02 — Consultar clima atual:** exibir temperatura, condição, umidade, vento, pressão e precipitação da cidade selecionada.
- **RF-03 — Consultar previsão:** exibir, para hoje mais os quatro dias seguintes, mínimas e máximas, condição, precipitação e vento em resumo diário.
- **RF-04 — Alternar unidade:** permitir alternar entre Celsius e Fahrenheit nas informações de temperatura.

## Requisitos Não-Funcionais

- **RNF-01 — Responsividade:** a interface deve seguir abordagem mobile-first e permitir as principais tarefas em viewports de 320 px até telas maiores, sem rolagem horizontal.
- **RNF-02 — Usabilidade:** usuários representativos devem conseguir concluir busca, consulta e troca de unidade sem ajuda; método de avaliação e taxa mínima de sucesso devem ser definidos.
- **RNF-03 — Atualidade dos dados:** cada consulta deve apresentar dados dentro do limite máximo de defasagem acordado e indicar quando os dados foram atualizados.
- **RNF-04 — Desempenho:** busca e carregamento do clima devem concluir em até 3 segundos no percentil 95, sob condições de rede e carga a serem definidas. Meta candidata, sujeita à validação.
- **RNF-05 — Acessibilidade:** a aplicação deve atender à WCAG 2.2 nível AA, incluindo operação por teclado, foco visível, contraste adequado e nomes acessíveis para controles.
- **RNF-06 — Disponibilidade:** a aplicação deve buscar disponibilidade mensal de 99,5%, com método de medição e tratamento de indisponibilidade do provedor externo definidos antes do lançamento. Meta candidata, sujeita à validação.
- **RNF-07 — Compatibilidade:** a aplicação deve suportar os navegadores e versões móveis e desktop acordados, além da faixa de tamanhos de tela definida para o produto.
- **RNF-08 — Resiliência:** falhas ou timeouts do serviço meteorológico devem resultar em mensagem compreensível e opção de tentar novamente; dados desatualizados não devem ser apresentados como atuais.
- **RNF-09 — Segurança e privacidade:** todo tráfego deve usar HTTPS; coleta e retenção de dados pessoais ou de localização devem ser minimizadas, informadas ao usuário e limitadas ao necessário para a funcionalidade aprovada.

> Os limites numéricos de desempenho e disponibilidade são propostas iniciais para discussão. Devem ser validados com as áreas de produto e tecnologia e com as garantias do provedor de dados.

## Riscos

As probabilidades são estimativas iniciais e devem ser revistas quando público, provedor e metas operacionais forem definidos.

| Risco | Tipo | Probabilidade | Impacto | Estratégia de mitigação |
|---|---|---|---|---|
| Indisponibilidade, latência ou limites do provedor meteorológico | Técnico | Média | Alto: consultas podem falhar ou demorar | Validar limites e SLA do provedor; monitorar erros e latência; definir timeouts, retentativas controladas e experiência clara para falhas. |
| Dados incompletos, defasados ou com cobertura regional insuficiente | Produto e técnico | Média | Alto: previsões podem parecer incorretas ou pouco úteis | Avaliar cobertura por região; definir a defasagem máxima aceitável; exibir horário de atualização e não apresentar dados antigos como atuais. |
| Seleção da cidade errada em buscas ambíguas | Produto e técnico | Média | Alto: o usuário recebe informações de outra localidade | Incluir país e estado/região nos resultados; validar cidades homônimas e nomes com acentos ou grafias alternativas. |
| Datas da previsão interpretadas no fuso errado | Produto e técnico | Média | Médio/alto: o usuário pode associar a previsão ao dia incorreto | Usar o fuso horário da cidade selecionada e rotular claramente cada dia da previsão. |
| Compatibilidade entre navegadores e dispositivos | Produto e técnico | Média | Médio/alto: alguns usuários podem ter problemas em navegadores não suportados | Definir navegadores e versões suportados; testar os fluxos principais em viewports móveis e desktop. |
| Metas vagas de desempenho e disponibilidade | Técnico | Média | Alto: não há critério objetivo para avaliar qualidade operacional | Validar metas mensuráveis com produto e tecnologia; medir latência e disponibilidade considerando a dependência do provedor. |
| Falha em tratar estados vazios, erros e conexão limitada | Produto e técnico | Média | Médio/alto: usuários podem ficar sem orientação ou confundir dados em cache com dados atuais | Especificar estados de carregamento, vazio e erro; definir política de cache, indicação de data e opção de tentar novamente. |
| Persistência local sem clareza de finalidade ou controle | Produto e técnico | Média | Médio/alto: risco de perda de confiança ou armazenamento desnecessário | Definir se cidade/unidade serão persistidas localmente e oferecer controle para apagar esses dados; não coletar localização na v1. |
| Custos, licenças ou cotas do provedor incompatíveis com o uso esperado | Técnico e negócio | Média | Médio/alto: aumento de custo ou interrupção do serviço | Revisar preços, licença, limites e condições de uso antes da escolha; estimar volume e acompanhar consumo. |
| Público prioritário e indicador de sucesso ainda não validados | Produto | Alta | Alto: a equipe pode otimizar a experiência para uma necessidade secundária ou não reconhecer se a consulta funciona | Validar a hipótese de público com usuários representativos e definir amostra e taxa mínima para o teste de conclusão sem ajuda. |

## Perguntas em Aberto e Decisões Resolvidas

Os itens marcados como **Resolvido** preservam a rastreabilidade das perguntas originais. Os demais registram a pergunta e o impacto provável de seguir sem resposta. Prioridades são indicativas: **P0** bloqueia decisões centrais de produto ou arquitetura; **P1** deve ser resolvido antes de fechar requisitos e critérios de aceite, mas pode permanecer como pergunta explícita no rascunho da spec.

1. **P0 — Público e necessidade**  
    **Pergunta:** Pessoas que consultam o clima antes de sair são o público prioritário, ou planejadores de atividades e viajantes têm maior necessidade? Em quais contextos isso deve ser validado?  
    **Impacto:** sem validar a hipótese de público e o problema principal, não há base confiável para priorizar funcionalidades, conteúdo e experiência.

2. **Resolvido — Regiões e idiomas**  
    **Decisão:** cobertura global para localidades disponíveis no Open-Meteo; idioma da interface pt-BR. A cobertura efetiva ainda será validada com o provedor.

3. **Resolvido — Identificação de cidades**  
    **Decisão:** mostrar cidade, região administrativa e país nos resultados, quando esses dados estiverem disponíveis.

4. **P1 — Busca**  
    **Pergunta:** A busca terá sugestões enquanto o usuário digita? Aceitará nomes parciais, acentos ou códigos postais? Geolocalização automática está fora do escopo da v1.  
   **Impacto:** uma busca limitada pode dificultar encontrar cidades e ficar aquém das expectativas dos usuários.

5. **Resolvido — Conteúdo do clima atual**  
    **Decisão:** temperatura, condição, umidade, vento, pressão e precipitação.

6. **Resolvido — Granularidade da previsão**  
    **Decisão:** resumo diário de hoje mais os quatro dias seguintes, com mínimas e máximas, condição, precipitação e vento.

7. **P1 — Datas e fuso horário**  
   **Pergunta:** A previsão deve usar o fuso horário da cidade selecionada e exibir o horário da última atualização?  
   **Impacto:** datas e horários podem parecer incorretos para usuários em outros fusos.

8. **P1 — Preferências de unidade**  
    **Pergunta:** A escolha entre Celsius e Fahrenheit será lembrada? Quais unidades serão usadas para vento, precipitação e distância?  
    **Impacto:** preferências não definidas podem resultar em unidades inconsistentes ou exigir conversões externas. A unidade inicial de temperatura já está definida como Celsius.

9. **P1 — Persistência da cidade selecionada**  
    **Pergunta:** A cidade selecionada deve permanecer entre visitas no armazenamento local do navegador? Favoritos e histórico estão fora do escopo da v1.  
    **Impacto:** sem essa decisão, a experiência pode variar entre visitas ou implementar persistência além do necessário.

10. **Resolvido — Alertas meteorológicos**  
    **Decisão:** alertas de condições severas não fazem parte do escopo da v1.

11. **P1 — Validação do provedor**  
    **Pergunta:** A cobertura global do Open-Meteo, sua licença, limites de uso e garantias são compatíveis com o produto?  
    **Impacto:** incompatibilidades podem exigir ajustes de escopo ou uma revisão da decisão antes do lançamento. O provedor escolhido já está definido como Open-Meteo.

12. **P0 — Atualidade dos dados**  
    **Pergunta:** Qual é a defasagem máxima aceitável e com que frequência os dados devem ser atualizados?  
    **Impacto:** informações antigas podem ser exibidas como atuais, comprometendo a confiança e a utilidade do app.

13. **P1 — Precisão e incerteza**  
    **Pergunta:** É necessário indicar a fonte, o horário de atualização ou limitações e incerteza da previsão?  
    **Impacto:** usuários podem interpretar a previsão como garantia, afetando a confiança e o uso responsável das informações.

14. **Resolvido — Plataforma móvel**  
    **Decisão:** aplicação web responsiva, mobile-first; não há requisito de PWA ou aplicativo nativo para a v1.

15. **P1 — Navegadores suportados**  
    **Pergunta:** Quais navegadores e versões devem ser suportados?  
    **Impacto:** sem uma matriz de suporte, “funciona em dispositivos móveis” não é verificável e pode haver incompatibilidades no lançamento.

16. **P0 — Estados de interface e falhas**  
    **Pergunta:** O que deve ocorrer quando a busca não encontra resultados, há erro ou timeout, ou o provedor está indisponível? Dados em cache podem ser exibidos?  
    **Impacto:** falhas podem deixar a interface sem orientação ou levar o usuário a confundir dados antigos com dados atuais.

17. **P1 — Conectividade limitada**  
    **Pergunta:** O app precisa oferecer cache ou algum comportamento offline para redes lentas ou sem conexão?  
    **Impacto:** sem essa decisão, o comportamento em condições comuns de uso móvel pode ser imprevisível.

18. **P1 — Desempenho**  
    **Pergunta:** Qual tempo de resposta é aceitável para busca e carregamento, em quais condições de rede e para qual percentil de usuários?  
    **Impacto:** “tempo adequado” não será mensurável, dificultando priorização e definição de pronto.

19. **P1 — Disponibilidade**  
    **Pergunta:** Qual disponibilidade é esperada e como serão contabilizadas falhas do provedor meteorológico?  
    **Impacto:** ficam indefinidos os objetivos operacionais, o monitoramento e a expectativa de serviço.

20. **P1 — Acessibilidade**  
    **Pergunta:** Qual padrão e nível de conformidade devem ser atendidos? A meta proposta de WCAG 2.2 nível AA é adequada?  
    **Impacto:** acessibilidade pode ser tratada tarde, exigindo retrabalho e excluindo usuários.

21. **P1 — Privacidade e preferências locais**  
    **Pergunta:** Se cidade ou unidade forem persistidas localmente, como o usuário será informado e poderá apagar esses dados? Geolocalização automática, favoritos e histórico estão fora do escopo da v1.  
    **Impacto:** persistência local não explicitada pode gerar dúvidas sobre privacidade e controle dos dados.

22. **P1 — Segurança**  
    **Pergunta:** Quais dados serão armazenados e quais controles de segurança são exigidos além de HTTPS?  
    **Impacto:** dados e integrações podem ficar sem proteção suficiente, e responsabilidades de segurança podem permanecer indefinidas.

23. **P0 — Critério de sucesso**  
    **Pergunta:** Qual taxa mínima de conclusão sem ajuda será aceitável no teste proposto, com quais participantes e tamanho de amostra?  
    **Impacto:** sem uma meta e um método acordados, o indicador candidato não permite determinar se a experiência atende à necessidade prioritária.

24. **P1 — Operação e custo**  
    **Pergunta:** Quem será responsável por suporte e operação? Quais limites de uso e custo dos provedores são aceitáveis?  
    **Impacto:** custos inesperados ou incidentes podem ficar sem responsável e sem resposta planejada.

## Suposições

- A aplicação inicial será web responsiva e mobile-first, com suporte a viewports a partir de 320 px.
- O usuário selecionará uma cidade a partir dos resultados da busca antes de consultar suas condições.
- Os resultados de busca identificarão cidade, região administrativa e país quando disponíveis.
- Celsius e Fahrenheit se aplicam a todas as temperaturas exibidas.
- A previsão será um resumo diário de hoje mais os quatro dias seguintes, com mínimas e máximas, condição, precipitação e vento.
- A cobertura geográfica será global, limitada às localidades disponíveis no Open-Meteo.
- Não haverá geolocalização automática, alertas, favoritos ou histórico de cidades na v1.
- Os dados meteorológicos serão obtidos do Open-Meteo; cobertura, licença e limites ainda precisam ser validados.
- Não haverá autenticação nem persistência de dados no servidor; persistência local da cidade ou unidade ainda está em aberto.

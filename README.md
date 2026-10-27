<div align="center">

# SDD Weather App

### Treinamento hands-on de **Spec-Driven Development** com **GitHub Copilot**

**Brief → Spec → Plan → Tasks → Code → Test → Review → Ship**

</div>

---

Este repositório é um **laboratório de treinamento de 8 horas** que ensina a
construir software guiado por especificação (**Spec-Driven Development**) usando
o **GitHub Copilot** em todas as etapas. O projeto final é um **Weather App** em
React + TypeScript que consome a API Open-Meteo.

> ## Princípio central
> **NÃO COMECE PELO CÓDIGO.** Sempre: **Spec → Plan → Tasks → Code.**

---

## O workshop

Comece pelo **[Guia do Workshop](workshop/GUIDE.md)** e siga os módulos em ordem.

| # | Módulo | Fase | Duração |
| --- | --- | --- | --- |
| 01 | [Setup](workshop/module-01-setup/README.md) | Preparação | 30 min |
| 02 | [Understanding the Problem](workshop/module-02-discovery/README.md) | Discovery | 45 min |
| 03 | [Writing the Specification](workshop/module-03-spec/README.md) | Spec | 50 min |
| 04 | [Creating the Technical Plan](workshop/module-04-plan/README.md) | Plan | 45 min |
| 05 | [Breaking Down Tasks](workshop/module-05-tasks/README.md) | Tasks | 40 min |
| 06 | [Building the UI](workshop/module-06-ui/README.md) | Code | 60 min |
| 07 | [Integrating APIs](workshop/module-07-api/README.md) | Code | 60 min |
| 08 | [Testing](workshop/module-08-testing/README.md) | Test | 55 min |
| 09 | [Hardening](workshop/module-09-hardening/README.md) | Test | 50 min |
| 10 | [Pull Request Review](workshop/module-10-review/README.md) | Review | 45 min |
| 11 | [Delivery (GitHub Pages)](workshop/module-11-delivery/README.md) | Ship | 30 min |

Cada módulo tem **README.md**, **challenge.md**, **prompts.md** e
**solution.md**.

---

## Começando

### Pré-requisitos

- **Node.js**
- **pnpm** (único gerenciador de pacotes suportado — habilite com `corepack enable`)
- **GitHub Copilot** habilitado no VS Code
- Git e uma conta no GitHub (para PR e deploy)

> O repositório inclui um **DevContainer** com tudo pré-configurado. Abra em um
> Codespace ou em "Reopen in Container" e pule a instalação manual.

### Instalação

```bash
pnpm install
pnpm exec playwright install   # navegadores para os testes E2E
```

### Scripts

```bash
pnpm dev             # servidor de desenvolvimento (Vite)
pnpm build           # build de produção
pnpm preview         # serve o build localmente
pnpm lint            # Biome (lint)
pnpm format          # Biome (formatação)
pnpm check           # Biome (lint + formatação)
pnpm test            # testes unitários (Vitest)
pnpm test:coverage   # cobertura
pnpm test:e2e        # testes E2E (Playwright)
```

---

## Arquitetura do app

```text
src/
├── components/      # apresentação (um componente por arquivo)
│   └── states/      # loading, erro, vazio
├── hooks/           # orquestração (useWeather)
├── services/        # acesso a dados (Open-Meteo) isolado
├── lib/             # funções puras (conversão, formatação, códigos WMO)
├── types/           # contratos compartilhados
├── styles/          # Tailwind + estilos globais
├── App.tsx          # composição da tela
└── main.tsx         # bootstrap React
```

Decisões-chave:

- **Temperaturas em Celsius** internamente; conversão só na apresentação (o
  toggle °C/°F **não** faz nova requisição).
- **Rede isolada** em `services/` — componentes e hooks não conhecem URLs.
- Sempre tratar **loading**, **erro** e **vazio**.

### Dados mock para desenvolver a UI

Os contratos estão em [`src/types/weather.ts`](src/types/weather.ts).
Importe o objeto tipado de [`src/mocks/weather.ts`](src/mocks/weather.ts)
no componente ou na tela em desenvolvimento:

```ts
import { mockWeatherData } from './mocks/weather';

const { city, current, forecast } = mockWeatherData;
```

O mock contém dados fictícios de Salvador (Bahia) e cinco datas fixas, de 27 a
31/10/2026, sem acesso à API. As temperaturas estão em Celsius, e o horário
de atualização inclui o deslocamento do fuso da cidade. Cada campo
meteorológico usa `WeatherField<T>`: leia `value` somente quando `available`
for `true`; `{ available: false }` representa um dado indisponível, não zero.

### Serviço de busca de cidades

[`searchCities`](src/services/weatherService.ts) consulta o geocoding da
Open-Meteo com o nome codificado, `count=100`, `language=pt` e `format=json`.
Texto vazio ou composto apenas por espaços retorna `[]` sem acessar a rede.
O serviço adapta os resultados ao contrato `City`, filtra candidatos inválidos
e preserva a ordem dos primeiros cinco válidos. Resultados ausentes ou vazios
retornam `[]`; HTTP não-ok e respostas estruturalmente inválidas lançam
`WeatherServiceError`. Falhas de rede e de JSON são propagadas.

Esta entrega é parcial da T-06: ainda não inclui timeout, cancelamento ou
integração com a interface, que permanece usando dados mock. O serviço está em
`weatherService.ts`, conforme o desafio 7.1, em vez do arquivo separado
`geocodingService.ts` previsto no plano.

### Componente de busca

[`SearchBar`](src/components/SearchBar.tsx) mantém o modo simples com
`onSearch(city: string)` e `disabled` opcional. No modo controlado, recebe
`query`, `onQueryChange`, `suggestions` e `onSelect`. A lista é um combobox
acessível: setas percorrem sugestões, Enter seleciona a opção ativa, Escape
fecha a lista e clique seleciona a localidade exata. Enter sem opção ativa
apenas repete a busca, nunca seleciona uma cidade automaticamente.
Texto vazio exibe mensagem acessível e devolve foco ao campo.

### Controle de unidade

[`UnitToggle`](src/components/UnitToggle.tsx) recebe `unit: Unit` e
`onChange(unit: Unit)`. É controlado: o componente pai mantém a unidade e
atualiza a prop após o callback. Os botões °C/°F expõem o estado ativo via
`aria-pressed`, em um grupo com nome acessível. Use Tab/Shift+Tab para navegar
e Enter/Espaço para ativar. O controle não converte dados nem acessa a API.

### Hero de condições meteorológicas

[`CurrentWeather`](src/components/CurrentWeather.tsx) recebe `city`, `current`
e `unit`. Exibe temperatura, condição e métricas com unidades, preserva zeros
válidos e identifica campos indisponíveis. O timestamp é exibido com o
deslocamento recebido; horário ausente é desconhecido e idade superior a uma
hora gera aviso de desatualização na renderização.

[`temperature`](src/lib/temperature.ts) converte e formata a origem Celsius
em pt-BR com uma casa decimal e empates arredondados para longe de zero.
[`weatherCodes`](src/lib/weatherCodes.ts) fornece ícones decorativos para
rótulos conhecidos, sem inferir ícone para rótulos desconhecidos. O contrato
atual fornece rótulos: o mapeamento de códigos WMO da API permanece na T-24.

### Previsão diária

[`ForecastList`](src/components/ForecastList.tsx) recebe `forecast: ForecastDay[]`
e `unit`; [`ForecastCard`](src/components/ForecastCard.tsx) recebe `day` e `unit`.
A lista preserva a ordem dos dias e usa duas, três ou cinco colunas conforme
o viewport. Cada card apresenta dia/data em pt-BR sem deslocamento de fuso,
condição, ícone, máxima/mínima, probabilidade de chuva (%), precipitação (mm)
e vento (km/h). Lista vazia e campos indisponíveis têm mensagens explícitas.

`precipitationProbabilityPercent` é independente de `precipitationMm`, usa
`WeatherField<number>` e aceita 0 a 100 inclusive. O mock inclui valores
fictícios; a semântica do campo da API será confirmada no gate T-22.

### Estados de apresentação

- [`LoadingState`](src/components/states/LoadingState.tsx): `role="status"`,
  mensagem padrão “Carregando dados...” e prop `message` opcional para
  identificar a operação. O indicador respeita a preferência por movimento reduzido.
- [`ErrorState`](src/components/states/ErrorState.tsx): recebe `message` e
  `onRetry`, com `operation` e `status` para distinguir busca/condições/previsão
  e erro/timeout; anuncia a mensagem com `role="alert"` e oferece o botão
  “Tentar novamente”, acessível por teclado.
- [`EmptyState`](src/components/states/EmptyState.tsx): recebe `title` e `hint`
  para distinguir ausência de cidades, localidades não identificáveis e dados
  meteorológicos indisponíveis; `onEdit` e `onRetry` habilitam ações separadas.

São componentes de apresentação: a integração escolhe o estado, fornece
mensagens específicas de operação/timeout e conecta os callbacks. Não fazem
requisições nem disparam retry automaticamente.

### Executando a tela mock

Execute `pnpm dev` para abrir a aplicação composta em [`App`](src/App.tsx).
A tela inicia sem cidade e em Celsius. Digite ao menos dois caracteres não
brancos; após 300 ms, selecione uma sugestão de Salvador. O catálogo contém
Salvador/Bahia e um homônimo explicitamente fictício, com dados distintos.
Não há geocoding nem API: outras consultas retornam vazio. Editar o texto
limpa seleção e dados; a unidade permanece independente.

[`useMockWeather`](src/hooks/useMockWeather.ts) coordena debounce, seleção e
estados independentes. Os controles “Cenário da busca”, “Cenário das condições”
e “Cenário da previsão” simulam loading, vazio, parcial, erro, timeout e sucesso.
Busca também permite simular candidatos inválidos. Os controles das seções
são habilitados somente após a seleção explícita. Loading/timeout são manuais,
não latência ou limite real de requisição.

“Tentar novamente” restaura apenas a operação escolhida; em busca, repete a
consulta sem selecionar automaticamente. Dados válidos da outra seção e a
unidade são preservados. Os dados parciais mantêm as cinco datas e assinalam
indisponibilidade, sem usar valores de outra data. Todas as temperaturas são
convertidas apenas na renderização; não há persistência ou geolocalização.

[`DataDisclosure`](src/components/DataDisclosure.tsx) explica o modo local
antes da busca, sem afirmar atribuição aprovada ou política de retenção.
A integração real, a atribuição definitiva e o gate T-22 continuam pendentes.

### Acessibilidade e responsividade

Os campos têm labels associados e bordas contrastantes; controles nativos
suportam teclado e foco visível. Busca inválida devolve foco ao campo; retry
move foco ao conteúdo persistente para não perdê-lo quando o botão é removido.
Sucesso e resultado vazio são anunciados por uma região `aria-live="polite"`;
loading e erros mantêm `status` e `alert` próprios, sem duplicar anúncios.
Mensagens e valores longos podem quebrar linha, sem truncar informação.

Os testes E2E verificam os cenários e entradas longas em 320, 375, 640,
768, 1024 e 1440 px, o número real de colunas (2/3/5), teclado e contraste de
texto dos botões, incluindo hover. Isso não substitui revisão com leitor de
tela, zoom e navegadores suportados; a validação de contraste dos fundos
translúcidos pressupõe a paleta escura atual, sem imagem de fundo.

T-23 (revisão manual com leitor de tela) e T-41 (matriz de duas versões por
navegador) **não estão concluídas**. Emulação mobile no Playwright não equivale
a Safari em dispositivo iOS real. Registre resultados manuais e versões reais
antes de aprovar esses gates; o demonstrador não é evidência da integração API.

---

## Stack

- **TypeScript** (strict) · **React** · **Vite**
- **Tailwind CSS** (tema dark glassmorphism)
- **Vitest** + **Testing Library** (unit) · **Playwright** (E2E)
- **Biome** (lint + formatação)
- **pnpm** (gerenciador de pacotes)
- **Open-Meteo** (geocoding + forecast, sem API key)

---

## Copilot no fluxo SDD

A pasta `.github/` traz a inteligência do laboratório:

- **`agents/`** — personas especializadas: Spec, Plan, Task, Code, Test, Review.
- **`prompts/`** — prompts de produção para cada etapa.
- **`instructions/`** — convenções (React, Tailwind, Testing) aplicadas
  automaticamente.
- **`workflows/`** — CI (lint/build/test/e2e), deploy no Pages e validações que
  **impõem a ordem Spec → Plan → Tasks**.

Veja [AGENTS.md](AGENTS.md) para a descrição de cada agente.

---

## Idioma

- Narrativa, comentários e documentação: **pt-BR**.
- Identificadores de código, nomes de arquivos e termos técnicos: **en-US**.

---

<div align="center">

Construído com ❤️ para capacitar times em **Spec-Driven Development** usando o poder do GitHub Copilot.

</div>

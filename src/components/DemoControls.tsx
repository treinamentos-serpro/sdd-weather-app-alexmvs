import type { MockSearchScenario, MockSectionScenario } from '../mocks/scenarios';

const searchOptions: { value: MockSearchScenario; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'loading', label: 'Carregando' },
  { value: 'empty', label: 'Sem resultados' },
  { value: 'invalid', label: 'Candidatos inválidos' },
  { value: 'error', label: 'Erro' },
  { value: 'timeout', label: 'Timeout' },
];
const sectionOptions: { value: MockSectionScenario; label: string }[] = [
  { value: 'success', label: 'Sucesso' },
  { value: 'loading', label: 'Carregando' },
  { value: 'empty', label: 'Sem dados' },
  { value: 'partial', label: 'Parcial' },
  { value: 'error', label: 'Erro' },
  { value: 'timeout', label: 'Timeout' },
];
const selectClass =
  'min-h-11 w-full rounded-xl border border-slate-500 bg-night-800 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50';

export interface DemoControlsProps {
  search: MockSearchScenario;
  current: MockSectionScenario;
  forecast: MockSectionScenario;
  hasCity: boolean;
  onSearch: (scenario: MockSearchScenario) => void;
  onCurrent: (scenario: MockSectionScenario) => void;
  onForecast: (scenario: MockSectionScenario) => void;
}

export default function DemoControls({
  search,
  current,
  forecast,
  hasCity,
  onSearch,
  onCurrent,
  onForecast,
}: DemoControlsProps) {
  return (
    <fieldset className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <legend className="px-2 font-semibold">Cenários de demonstração</legend>
      <p className="mb-4 text-sm text-slate-300">
        Pesquise Salvador e selecione uma opção. Loading e timeout são simulações manuais; retry
        restaura somente a operação escolhida.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="min-w-0 text-sm">
          Cenário da busca
          <select
            className={selectClass}
            value={search}
            onChange={(event) => {
              const option = searchOptions.find(({ value }) => value === event.target.value);
              if (option) onSearch(option.value);
            }}
          >
            {searchOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-sm">
          Cenário das condições
          <select
            className={selectClass}
            value={current}
            disabled={!hasCity}
            onChange={(event) => {
              const option = sectionOptions.find(({ value }) => value === event.target.value);
              if (option) onCurrent(option.value);
            }}
          >
            {sectionOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-sm">
          Cenário da previsão
          <select
            className={selectClass}
            value={forecast}
            disabled={!hasCity}
            onChange={(event) => {
              const option = sectionOptions.find(({ value }) => value === event.target.value);
              if (option) onForecast(option.value);
            }}
          >
            {sectionOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </fieldset>
  );
}

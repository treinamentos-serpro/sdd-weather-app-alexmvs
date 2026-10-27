import { useEffect, useState } from 'react';
import { searchMockCities } from '../mocks/catalog';
import {
  type MockSearchScenario,
  type MockSectionScenario,
  mockCurrentSection,
  mockForecastSection,
} from '../mocks/scenarios';
import type { City, SectionState, Unit, WeatherState } from '../types/weather';

function idle<T>(): SectionState<T> {
  return { status: 'idle', data: null, error: null };
}

const initialState: WeatherState = {
  query: '',
  suggestions: [],
  searchStatus: 'idle',
  searchError: null,
  selectedCity: null,
  current: idle(),
  forecast: idle(),
  unit: 'celsius',
};

export default function useMockWeather() {
  const [state, setState] = useState(initialState);
  const [searchScenario, setSearchScenario] = useState<MockSearchScenario>('normal');
  const [searchAttempt, setSearchAttempt] = useState(0);
  const [currentScenario, setCurrentScenario] = useState<MockSectionScenario>('success');
  const [forecastScenario, setForecastScenario] = useState<MockSectionScenario>('success');

  // biome-ignore lint/correctness/useExhaustiveDependencies: retry da mesma consulta precisa reiniciar o debounce.
  useEffect(() => {
    if (state.selectedCity || state.query.replace(/\s/g, '').length < 2) return;
    const timer = setTimeout(() => {
      const suggestions = searchScenario === 'normal' ? searchMockCities(state.query) : [];
      setState((previous) => ({
        ...previous,
        suggestions,
        searchStatus:
          searchScenario === 'normal'
            ? suggestions.length
              ? 'success'
              : 'empty'
            : searchScenario === 'invalid'
              ? 'empty'
              : searchScenario,
        searchError:
          searchScenario === 'error' || searchScenario === 'timeout'
            ? {
                kind: searchScenario === 'timeout' ? 'timeout' : 'network',
                message:
                  searchScenario === 'timeout'
                    ? 'Tempo limite simulado excedido.'
                    : 'Falha simulada de rede.',
              }
            : null,
      }));
    }, 300);
    return () => clearTimeout(timer);
  }, [state.query, state.selectedCity, searchScenario, searchAttempt]);

  function changeQuery(query: string) {
    setState((previous) => ({
      ...previous,
      query,
      selectedCity: null,
      suggestions: [],
      searchStatus: 'idle',
      searchError: null,
      current: idle(),
      forecast: idle(),
    }));
    setCurrentScenario('success');
    setForecastScenario('success');
  }

  function search(query: string) {
    changeQuery(query);
    setSearchAttempt((attempt) => attempt + 1);
  }

  function selectCity(city: City) {
    const current = mockCurrentSection(city, 'success');
    const forecast = mockForecastSection(city, 'success');
    setCurrentScenario('success');
    setForecastScenario('success');
    setState((previous) => ({
      ...previous,
      query: city.name,
      selectedCity: city,
      suggestions: [],
      searchStatus: 'success',
      searchError: null,
      current,
      forecast,
    }));
  }

  function changeSearchScenario(scenario: MockSearchScenario) {
    setSearchScenario(scenario);
    changeQuery(state.query);
    setSearchAttempt((attempt) => attempt + 1);
  }

  function changeCurrentScenario(scenario: MockSectionScenario) {
    if (!state.selectedCity) throw new Error('Selecione uma cidade antes de simular condições.');
    const current = mockCurrentSection(state.selectedCity, scenario);
    setCurrentScenario(scenario);
    setState((previous) => ({ ...previous, current }));
  }

  function changeForecastScenario(scenario: MockSectionScenario) {
    if (!state.selectedCity) throw new Error('Selecione uma cidade antes de simular previsão.');
    const forecast = mockForecastSection(state.selectedCity, scenario);
    setForecastScenario(scenario);
    setState((previous) => ({ ...previous, forecast }));
  }

  function setUnit(unit: Unit) {
    setState((previous) => ({ ...previous, unit }));
  }

  return {
    ...state,
    searchScenario,
    currentScenario,
    forecastScenario,
    changeQuery,
    search,
    selectCity,
    setUnit,
    changeSearchScenario,
    changeCurrentScenario,
    changeForecastScenario,
    retrySearch: () => changeSearchScenario('normal'),
    retryCurrent: () => changeCurrentScenario('success'),
    retryForecast: () => changeForecastScenario('success'),
  };
}

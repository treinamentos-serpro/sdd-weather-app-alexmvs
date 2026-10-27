import { useEffect, useRef, useState } from 'react';
import {
  getCurrentWeather,
  getForecast,
  searchCities,
  WeatherServiceError,
} from '../services/weatherService';
import type {
  City,
  SectionState,
  WeatherError,
  WeatherField,
  WeatherOperation,
  WeatherState,
} from '../types/weather';

function idle<T>(): SectionState<T> {
  return { status: 'idle', data: null, error: null };
}

const initialState: Omit<WeatherState, 'unit'> = {
  query: '',
  suggestions: [],
  searchStatus: 'idle',
  searchError: null,
  selectedCity: null,
  current: idle(),
  forecast: idle(),
};

function section<T>(data: T, fields: WeatherField<unknown>[]): SectionState<T> {
  const available = fields.filter((field) => field.available).length;
  return {
    status: available === 0 ? 'empty' : available === fields.length ? 'success' : 'partial',
    data,
    error: null,
  };
}

function toError(error: unknown): WeatherError {
  if (error instanceof WeatherServiceError) {
    return {
      kind: error.kind === 'aborted' ? 'network' : error.kind,
      message: error.message,
    };
  }
  console.error('Falha inesperada no fluxo de clima.', error);
  return { kind: 'network', message: 'Falha inesperada. Tente novamente.' };
}

export default function useWeather() {
  const [state, setState] = useState(initialState);
  const controllers = useRef<Partial<Record<WeatherOperation, AbortController>>>({});
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedCity = useRef<City | null>(null);
  const query = useRef('');

  function cancelSearchTimer() {
    if (debounceTimer.current !== null) clearTimeout(debounceTimer.current);
    debounceTimer.current = null;
  }

  function cancelAll() {
    cancelSearchTimer();
    for (const controller of Object.values(controllers.current)) controller.abort();
  }

  useEffect(() => {
    return () => {
      if (debounceTimer.current !== null) clearTimeout(debounceTimer.current);
      for (const controller of Object.values(controllers.current)) controller.abort();
    };
  }, []);

  async function loadSection<T>(
    operation: 'current' | 'forecast',
    city: City,
    load: (signal: AbortSignal) => Promise<SectionState<T>>,
  ) {
    controllers.current[operation]?.abort();
    const controller = new AbortController();
    controllers.current[operation] = controller;
    setState((previous) => ({
      ...previous,
      [operation]: { status: 'loading', data: null, error: null },
    }));
    try {
      const result = await load(controller.signal);
      if (controller.signal.aborted || selectedCity.current !== city) return;
      setState((previous) => ({ ...previous, [operation]: result }));
    } catch (error) {
      if (controller.signal.aborted || selectedCity.current !== city) return;
      const normalized = toError(error);
      setState((previous) => ({
        ...previous,
        [operation]: {
          status: normalized.kind === 'timeout' ? 'timeout' : 'error',
          data: null,
          error: normalized,
        },
      }));
    }
  }

  function loadCurrent(city: City) {
    return loadSection('current', city, async (signal) => {
      const data = await getCurrentWeather(city, signal);
      const { updatedAt: _, ...fields } = data;
      return section(data, Object.values(fields));
    });
  }

  function loadForecast(city: City) {
    return loadSection('forecast', city, async (signal) => {
      const data = await getForecast(city, signal);
      return section(
        data,
        data.flatMap(({ date: _, ...fields }) => Object.values(fields)),
      );
    });
  }

  function reset(nextQuery: string) {
    cancelAll();
    query.current = nextQuery;
    selectedCity.current = null;
    setState({ ...initialState, query: nextQuery });
  }

  async function search(name: string) {
    const trimmed = name.trim();
    reset(name);
    if (trimmed.replace(/\s/g, '').length < 3) return;
    const controller = new AbortController();
    controllers.current.search = controller;
    setState((previous) => ({ ...previous, searchStatus: 'loading' }));
    try {
      const suggestions = await searchCities(trimmed, controller.signal);
      if (controller.signal.aborted) return;
      setState((previous) => ({
        ...previous,
        suggestions,
        searchStatus: suggestions.length ? 'success' : 'empty',
      }));
    } catch (error) {
      if (controller.signal.aborted) return;
      const normalized = toError(error);
      setState((previous) => ({
        ...previous,
        searchStatus: normalized.kind === 'timeout' ? 'timeout' : 'error',
        searchError: normalized,
      }));
    }
  }

  function changeQuery(name: string) {
    reset(name);
    if (name.replace(/\s/g, '').length >= 3) {
      debounceTimer.current = setTimeout(() => {
        void search(name);
      }, 300);
    }
  }

  async function selectCity(city: City) {
    cancelAll();
    selectedCity.current = city;
    setState((previous) => ({
      ...previous,
      selectedCity: city,
      current: idle(),
      forecast: idle(),
    }));
    await Promise.all([loadCurrent(city), loadForecast(city)]);
  }

  function retryCurrent() {
    return selectedCity.current ? loadCurrent(selectedCity.current) : Promise.resolve();
  }

  function retryForecast() {
    return selectedCity.current ? loadForecast(selectedCity.current) : Promise.resolve();
  }

  return {
    ...state,
    changeQuery,
    search,
    selectCity,
    retrySearch: () => search(query.current),
    retryCurrent,
    retryForecast,
  };
}

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useMockWeather from '../../../src/hooks/useMockWeather';
import { mockCatalog } from '../../../src/mocks/catalog';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useMockWeather', () => {
  it('aplica mínimo de dois caracteres não brancos e debounce de 300ms', () => {
    const { result } = renderHook(useMockWeather);
    act(() => result.current.changeQuery(' s '));
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.suggestions).toEqual([]);
    act(() => result.current.changeQuery(' sa '));
    act(() => vi.advanceTimersByTime(299));
    expect(result.current.suggestions).toEqual([]);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.suggestions).toHaveLength(2);
    expect(result.current.selectedCity).toBeNull();
    expect(result.current.current.status).toBe('idle');
  });

  it('cancela consultas anteriores na edição e no unmount', () => {
    const { result, unmount } = renderHook(useMockWeather);
    act(() => result.current.changeQuery('Salvador'));
    act(() => vi.advanceTimersByTime(299));
    act(() => result.current.changeQuery('Recife'));
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.suggestions).toEqual([]);
    act(() => vi.advanceTimersByTime(299));
    expect(result.current.searchStatus).toBe('empty');
    act(() => result.current.changeQuery('Salvador'));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('seleciona explicitamente o homônimo correto e limpa dados na edição', () => {
    const { result } = renderHook(useMockWeather);
    act(() => result.current.selectCity(mockCatalog[1].city));
    expect(result.current.selectedCity).toEqual(mockCatalog[1].city);
    expect(result.current.current.data?.temperatureC).toEqual({ available: true, value: 12.4 });
    expect(result.current.forecast.data).toEqual(mockCatalog[1].forecast);
    act(() => result.current.setUnit('fahrenheit'));
    act(() => result.current.changeQuery('Salv'));
    expect(result.current.selectedCity).toBeNull();
    expect(result.current.current.data).toBeNull();
    expect(result.current.forecast.data).toBeNull();
    expect(result.current.unit).toBe('fahrenheit');
  });

  it('mantém a outra seção e a unidade durante erro, timeout e retry isolado', () => {
    const { result } = renderHook(useMockWeather);
    act(() => result.current.selectCity(mockCatalog[0].city));
    act(() => result.current.changeCurrentScenario('error'));
    expect(result.current.forecast.data).toEqual(mockCatalog[0].forecast);
    act(() => result.current.changeForecastScenario('timeout'));
    act(() => result.current.setUnit('fahrenheit'));
    act(() => result.current.retryCurrent());
    expect(result.current.current.status).toBe('success');
    expect(result.current.forecast.status).toBe('timeout');
    expect(result.current.forecast.error?.kind).toBe('timeout');
    expect(result.current.unit).toBe('fahrenheit');
    act(() => result.current.retryForecast());
    expect(result.current.forecast.status).toBe('success');
  });

  it.each([
    'loading',
    'empty',
    'partial',
    'error',
    'timeout',
  ] as const)('simula %s por seção sem alterar a fixture', (scenario) => {
    const original = structuredClone(mockCatalog);
    const { result } = renderHook(useMockWeather);
    act(() => result.current.selectCity(mockCatalog[0].city));
    act(() => result.current.changeCurrentScenario(scenario));
    act(() => result.current.changeForecastScenario(scenario));
    expect(result.current.current.status).toBe(scenario);
    expect(result.current.forecast.status).toBe(scenario);
    if (scenario === 'partial') {
      expect(result.current.forecast.data).toHaveLength(5);
      expect(result.current.forecast.data?.[1].minTemperatureC.available).toBe(false);
      expect(result.current.forecast.data?.[2]).toEqual(original[0].forecast[2]);
    }
    expect(mockCatalog).toEqual(original);
  });

  it.each([
    'empty',
    'invalid',
    'error',
    'timeout',
    'loading',
  ] as const)('recupera cenário de busca %s preservando a consulta', (scenario) => {
    const { result } = renderHook(useMockWeather);
    act(() => result.current.changeQuery('Salvador'));
    act(() => result.current.changeSearchScenario(scenario));
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.searchStatus).toBe(scenario === 'invalid' ? 'empty' : scenario);
    act(() => result.current.retrySearch());
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.query).toBe('Salvador');
    expect(result.current.suggestions).toHaveLength(2);
    expect(result.current.selectedCity).toBeNull();
  });
});

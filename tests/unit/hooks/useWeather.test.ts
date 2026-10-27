import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useWeather from '../../../src/hooks/useWeather';
import { mockWeatherData } from '../../../src/mocks/weather';
import {
  getCurrentWeather,
  getForecast,
  searchCities,
  WeatherServiceError,
} from '../../../src/services/weatherService';
import type { City, CurrentWeather, ForecastDay } from '../../../src/types/weather';

vi.mock('../../../src/services/weatherService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../../src/services/weatherService')>();
  return { ...original, searchCities: vi.fn(), getCurrentWeather: vi.fn(), getForecast: vi.fn() };
});

const city = mockWeatherData.city;
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
beforeEach(() => {
  vi.mocked(searchCities).mockResolvedValue([city]);
  vi.mocked(getCurrentWeather).mockResolvedValue(mockWeatherData.current);
  vi.mocked(getForecast).mockResolvedValue(mockWeatherData.forecast);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.resetAllMocks();
  vi.useRealTimers();
});

describe('busca e autocomplete', () => {
  it('inicia sem cidade ou consultas', () => {
    const { result } = renderHook(useWeather);
    expect(result.current).toMatchObject({
      query: '',
      suggestions: [],
      searchStatus: 'idle',
      selectedCity: null,
      current: { status: 'idle' },
      forecast: { status: 'idle' },
    });
    expect(searchCities).not.toHaveBeenCalled();
  });

  it.each(['', 'Sa', ' S a '])('não consulta abaixo do mínimo: %j', async (query) => {
    vi.useFakeTimers();
    const { result } = renderHook(useWeather);
    act(() => result.current.changeQuery(query));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    await act(() => result.current.search(query));
    expect(searchCities).not.toHaveBeenCalled();
    expect(result.current.suggestions).toEqual([]);
  });

  it('consulta exatamente em 300 ms, sem selecionar automaticamente', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(useWeather);
    act(() => result.current.changeQuery('Sal'));
    await act(() => vi.advanceTimersByTimeAsync(299));
    expect(searchCities).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(searchCities).toHaveBeenCalledExactlyOnceWith('Sal', expect.any(AbortSignal));
    expect(result.current).toMatchObject({
      searchStatus: 'success',
      suggestions: [city],
      selectedCity: null,
    });
    expect(getCurrentWeather).not.toHaveBeenCalled();
    expect(getForecast).not.toHaveBeenCalled();
  });

  it('reinicia timer, cancela abaixo do mínimo e cancela ao desmontar', async () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(useWeather);
    act(() => result.current.changeQuery('Sal'));
    await act(() => vi.advanceTimersByTimeAsync(200));
    act(() => result.current.changeQuery('Salv'));
    await act(() => vi.advanceTimersByTimeAsync(299));
    expect(searchCities).not.toHaveBeenCalled();
    act(() => result.current.changeQuery('Sa'));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(searchCities).not.toHaveBeenCalled();
    act(() => result.current.changeQuery('Sal'));
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(searchCities).not.toHaveBeenCalled();
  });

  it('envio cancela timer sem duplicar geocoding e não chama clima', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(useWeather);
    act(() => result.current.changeQuery('Sal'));
    await act(() => result.current.search('Sal'));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getForecast).not.toHaveBeenCalled();
  });

  it.each(['empty', 'error', 'timeout'] as const)('retry recupera busca em %s', async (status) => {
    if (status === 'empty') vi.mocked(searchCities).mockResolvedValueOnce([]);
    else
      vi.mocked(searchCities).mockRejectedValueOnce(
        new WeatherServiceError('Falha de busca', {
          kind: status === 'timeout' ? 'timeout' : 'network',
        }),
      );
    const { result } = renderHook(useWeather);
    await act(() => result.current.search('Sal'));
    expect(result.current.searchStatus).toBe(status);
    await act(() => result.current.retrySearch());
    expect(result.current.searchStatus).toBe('success');
    expect(searchCities).toHaveBeenNthCalledWith(2, 'Sal', expect.any(AbortSignal));
    expect(getForecast).not.toHaveBeenCalled();
  });

  it('aborta busca anterior e ignora seu sucesso tardio', async () => {
    const old = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(old.promise);
    const { result } = renderHook(useWeather);
    let task: Promise<void>;
    act(() => {
      task = result.current.search('Antiga');
    });
    const signal = vi.mocked(searchCities).mock.calls[0][1];
    await act(() => result.current.search('Nova'));
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      old.resolve([]);
      await task;
    });
    expect(result.current).toMatchObject({
      query: 'Nova',
      searchStatus: 'success',
      suggestions: [city],
    });
  });
});

describe('carregamentos independentes', () => {
  it('inicia as duas consultas antes de resolver qualquer uma', async () => {
    const current = deferred<CurrentWeather>();
    const forecast = deferred<ForecastDay[]>();
    vi.mocked(getCurrentWeather).mockReturnValue(current.promise);
    vi.mocked(getForecast).mockReturnValue(forecast.promise);
    const { result } = renderHook(useWeather);
    let task: Promise<void>;
    act(() => {
      task = result.current.selectCity(city);
    });
    expect(getCurrentWeather).toHaveBeenCalledExactlyOnceWith(city, expect.any(AbortSignal));
    expect(getForecast).toHaveBeenCalledExactlyOnceWith(city, expect.any(AbortSignal));
    expect(result.current.current.status).toBe('loading');
    expect(result.current.forecast.status).toBe('loading');
    await act(async () => {
      current.resolve(mockWeatherData.current);
    });
    expect(result.current.current.status).toBe('success');
    expect(result.current.forecast.status).toBe('loading');
    await act(async () => {
      forecast.resolve(mockWeatherData.forecast);
      await task;
    });
    expect(result.current.forecast.status).toBe('success');
  });

  it.each([
    'current',
    'forecast',
  ] as const)('timeout e retry de %s preservam a outra seção', async (operation) => {
    const service = operation === 'current' ? vi.mocked(getCurrentWeather) : vi.mocked(getForecast);
    service.mockRejectedValueOnce(new WeatherServiceError('Tempo limite', { kind: 'timeout' }));
    const { result } = renderHook(useWeather);
    await act(() => result.current.selectCity(city));
    const other = operation === 'current' ? 'forecast' : 'current';
    const preserved = result.current[other];
    expect(result.current[operation].status).toBe('timeout');
    expect(preserved.status).toBe('success');
    await act(() =>
      operation === 'current' ? result.current.retryCurrent() : result.current.retryForecast(),
    );
    expect(result.current[operation].status).toBe('success');
    expect(result.current[other]).toBe(preserved);
    expect(getCurrentWeather).toHaveBeenCalledTimes(operation === 'current' ? 2 : 1);
    expect(getForecast).toHaveBeenCalledTimes(operation === 'forecast' ? 2 : 1);
    expect(searchCities).not.toHaveBeenCalled();
  });

  it('distingue dados parciais e totalmente indisponíveis', async () => {
    vi.mocked(getCurrentWeather).mockResolvedValueOnce({
      ...mockWeatherData.current,
      humidityPercent: { available: false },
    });
    vi.mocked(getForecast).mockResolvedValueOnce(
      mockWeatherData.forecast.map(({ date }) => ({
        date,
        minTemperatureC: { available: false },
        maxTemperatureC: { available: false },
        conditionLabel: { available: false },
        precipitationProbabilityPercent: { available: false },
        precipitationMm: { available: false },
        windKmh: { available: false },
      })),
    );
    const { result } = renderHook(useWeather);
    await act(() => result.current.selectCity(city));
    expect(result.current.current.status).toBe('partial');
    expect(result.current.forecast.status).toBe('empty');
  });

  it('retry substitui a tentativa anterior, inclusive para a mesma cidade', async () => {
    const pending = deferred<CurrentWeather>();
    vi.mocked(getCurrentWeather).mockReturnValueOnce(pending.promise);
    const { result } = renderHook(useWeather);
    let task: Promise<void>;
    act(() => {
      task = result.current.selectCity(city);
    });
    const signal = vi.mocked(getCurrentWeather).mock.calls[0][1];
    await act(() => result.current.retryCurrent());
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      pending.reject(new WeatherServiceError('Antiga'));
      await task;
    });
    expect(result.current.current.status).toBe('success');
  });

  it('troca de cidade aborta ambas e ignora respostas antigas', async () => {
    const current = deferred<CurrentWeather>();
    const forecast = deferred<ForecastDay[]>();
    vi.mocked(getCurrentWeather).mockReturnValueOnce(current.promise);
    vi.mocked(getForecast).mockReturnValueOnce(forecast.promise);
    const { result } = renderHook(useWeather);
    let task: Promise<void>;
    act(() => {
      task = result.current.selectCity(city);
    });
    const oldSignals = [
      vi.mocked(getCurrentWeather).mock.calls[0][1],
      vi.mocked(getForecast).mock.calls[0][1],
    ];
    const other = { ...city, name: 'Outra' };
    await act(() => result.current.selectCity(other));
    expect(oldSignals.every((signal) => signal?.aborted)).toBe(true);
    await act(async () => {
      current.resolve({
        ...mockWeatherData.current,
        temperatureC: { available: true, value: -99 },
      });
      forecast.reject(new WeatherServiceError('Antiga'));
      await task;
    });
    expect(result.current.selectedCity).toBe(other);
    expect(result.current.current.data).toEqual(mockWeatherData.current);
    expect(result.current.forecast.status).toBe('success');
  });

  it('edição e desmontagem abortam requisições e limpam dados', async () => {
    const current = deferred<CurrentWeather>();
    vi.mocked(getCurrentWeather).mockReturnValue(current.promise);
    const { result, unmount } = renderHook(useWeather);
    let task: Promise<void>;
    act(() => {
      task = result.current.selectCity(city);
    });
    const signal = vi.mocked(getCurrentWeather).mock.calls[0][1];
    act(() => result.current.changeQuery('Sa'));
    expect(signal?.aborted).toBe(true);
    expect(result.current).toMatchObject({
      selectedCity: null,
      current: { status: 'idle', data: null },
    });
    unmount();
    await act(async () => {
      current.resolve(mockWeatherData.current);
      await task;
    });
  });

  it('registra falhas inesperadas sem apresentá-las como vazio', async () => {
    const error = new Error('Erro interno');
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(getCurrentWeather).mockRejectedValueOnce(error);
    const { result } = renderHook(useWeather);
    await act(() => result.current.selectCity(city));
    expect(result.current.current.status).toBe('error');
    expect(log).toHaveBeenCalledWith('Falha inesperada no fluxo de clima.', error);
    expect(result.current.forecast.status).toBe('success');
  });
});

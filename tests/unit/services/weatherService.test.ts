import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getCurrentWeather,
  getForecast,
  getWeather,
  searchCities,
  WeatherServiceError,
} from '../../../src/services/weatherService';

const city = {
  name: 'São Paulo',
  admin1: 'São Paulo',
  country: 'Brasil',
  latitude: -23.5475,
  longitude: -46.6361,
  timezone: 'America/Sao_Paulo',
};

function mockResponse(body: unknown, status = 200) {
  const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function forecastResponse() {
  return {
    timezone: 'America/Sao_Paulo',
    utc_offset_seconds: -10800,
    current_units: {
      temperature_2m: '°C',
      relative_humidity_2m: '%',
      wind_speed_10m: 'km/h',
      surface_pressure: 'hPa',
      precipitation: 'mm',
    },
    current: {
      time: '2026-10-27T14:00',
      temperature_2m: 22.4,
      relative_humidity_2m: 65,
      wind_speed_10m: 10.1,
      surface_pressure: 1014.2,
      precipitation: 0,
      weather_code: 2,
    },
    daily_units: {
      temperature_2m_min: '°C',
      temperature_2m_max: '°C',
      precipitation_probability_max: '%',
      precipitation_sum: 'mm',
      wind_speed_10m_max: 'km/h',
    },
    daily: {
      time: ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'],
      temperature_2m_min: [18, 19, 20, 21, 22],
      temperature_2m_max: [25, 26, 27, 28, 29],
      weather_code: [0, 3, 61, 71, 95],
      precipitation_probability_max: [0, 100, 25, 50, 75],
      precipitation_sum: [0, 1, 2, 3, 4],
      wind_speed_10m_max: [10, 11, 12, 13, 14],
    },
  };
}

describe('getWeather', () => {
  function freezeTime(time = '2026-10-27T18:00:00Z') {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(time));
  }

  it('compõe requisições independentes com as coordenadas e unidades do plano', async () => {
    freezeTime();
    const fetchMock = mockResponse(forecastResponse());

    await getWeather(city);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const urls = fetchMock.mock.calls.map(([url]) => new URL(String(url)));
    for (const url of urls) {
      expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
      expect(url.searchParams.get('latitude')).toBe(String(city.latitude));
      expect(url.searchParams.get('longitude')).toBe(String(city.longitude));
      expect(url.searchParams.get('temperature_unit')).toBe('celsius');
      expect(url.searchParams.get('wind_speed_unit')).toBe('kmh');
      expect(url.searchParams.get('precipitation_unit')).toBe('mm');
      expect(url.searchParams.get('timezone')).toBe('auto');
      expect(url.searchParams.get('timeformat')).toBe('iso8601');
    }
    expect(urls[0].searchParams.get('current')).toBe(
      'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,surface_pressure',
    );
    expect(urls[0].searchParams.has('daily')).toBe(false);
    expect(urls[0].searchParams.has('forecast_days')).toBe(false);
    expect(urls[1].searchParams.get('daily')).toBe(
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max',
    );
    expect(urls[1].searchParams.get('forecast_days')).toBe('5');
    expect(urls[1].searchParams.has('current')).toBe(false);
  });

  it('mapeia todos os campos atuais e cinco dias pelos índices dos arrays paralelos', async () => {
    freezeTime();
    const body = forecastResponse();
    mockResponse(body);

    const result = await getWeather(city);

    expect(result.city).toEqual(city);
    expect(result.current).toEqual({
      temperatureC: { available: true, value: 22.4 },
      humidityPercent: { available: true, value: 65 },
      windKmh: { available: true, value: 10.1 },
      pressureHpa: { available: true, value: 1014.2 },
      precipitationMm: { available: true, value: 0 },
      conditionLabel: { available: true, value: 'Parcialmente nublado' },
      updatedAt: null,
    });
    expect(result.forecast).toEqual(
      body.daily.time.map((date, index) => ({
        date,
        minTemperatureC: { available: true, value: 18 + index },
        maxTemperatureC: { available: true, value: 25 + index },
        precipitationMm: { available: true, value: index },
        windKmh: { available: true, value: 10 + index },
        precipitationProbabilityPercent: {
          available: true,
          value: body.daily.precipitation_probability_max[index],
        },
        conditionLabel: {
          available: true,
          value: ['Céu limpo', 'Encoberto', 'Chuva leve', 'Neve leve', 'Trovoada'][index],
        },
      })),
    );
  });

  it('não transforma precipitação nula em zero nem perde os demais campos', async () => {
    freezeTime();
    const body = forecastResponse();
    mockResponse({
      ...body,
      current: { ...body.current, precipitation: null },
      daily: { ...body.daily, precipitation_sum: [null, 0, 2, 3, 4] },
    });

    const result = await getWeather(city);

    expect(result.current.precipitationMm).toEqual({ available: false });
    expect(result.current.temperatureC).toEqual({ available: true, value: 22.4 });
    expect(result.forecast).toHaveLength(5);
    expect(result.forecast[0].precipitationMm).toEqual({ available: false });
    expect(result.forecast[0].maxTemperatureC).toEqual({ available: true, value: 25 });
    expect(result.forecast[1].precipitationMm).toEqual({ available: true, value: 0 });
    expect(result.forecast[2].precipitationMm).toEqual({ available: true, value: 2 });
  });

  it.each([
    'current',
    'daily',
  ])('rejeita resposta com %s ausente, nulo ou inválido', async (key) => {
    for (const value of [undefined, null, [], 'inválido']) {
      mockResponse({ ...forecastResponse(), [key]: value });
      await expect(getWeather(city)).rejects.toThrow(WeatherServiceError);
      vi.restoreAllMocks();
    }
  });

  it.each([400, 429, 500])('rejeita HTTP %i', async (status) => {
    mockResponse({}, status);
    await expect(getWeather(city)).rejects.toThrow(WeatherServiceError);
  });

  it.each([
    null,
    {},
    { error: true },
    { current: {}, daily: {} },
  ])('rejeita resposta incompleta ou erro do provedor: %j', async (body) => {
    mockResponse(body);
    await expect(getWeather(city)).rejects.toThrow(WeatherServiceError);
  });

  it('preserva cinco datas locais e não desloca valores quando falta uma data ou campo', async () => {
    freezeTime('2026-10-28T01:00:00Z');
    const body = forecastResponse();
    body.daily.time = ['2026-10-27', '2026-10-29'];
    body.daily.temperature_2m_min = [18, 20];
    body.daily.temperature_2m_max = [25];
    mockResponse(body);

    const { forecast } = await getWeather(city);

    expect(forecast.map((day) => day.date)).toEqual(forecastResponse().daily.time);
    expect(forecast[1].minTemperatureC).toEqual({ available: false });
    expect(forecast[2].minTemperatureC).toEqual({ available: true, value: 20 });
    expect(forecast[2].maxTemperatureC).toEqual({ available: false });
    expect(forecast[4].conditionLabel).toEqual({ available: false });
  });

  it('marca campos ausentes, nulos, não finitos, unidades incompatíveis e WMO desconhecido como indisponíveis', async () => {
    freezeTime();
    const body = forecastResponse();
    mockResponse({
      ...body,
      current: { temperature_2m: null, weather_code: 999, relative_humidity_2m: 101 },
      daily: {
        ...body.daily,
        temperature_2m_min: [null, '18'],
        temperature_2m_max: [Infinity],
        precipitation_probability_max: [-1, 101, null],
        weather_code: [999],
      },
      daily_units: { ...body.daily_units, precipitation_sum: 'inch' },
    });

    const result = await getWeather(city);

    expect(result.current.updatedAt).toBeNull();
    for (const [key, field] of Object.entries(result.current)) {
      if (key !== 'updatedAt') expect(field).toEqual({ available: false });
    }
    expect(result.forecast[0].minTemperatureC).toEqual({ available: false });
    expect(result.forecast[0].maxTemperatureC).toEqual({ available: false });
    expect(result.forecast[0].conditionLabel).toEqual({ available: false });
    expect(result.forecast[0].precipitationMm).toEqual({ available: false });
    for (const day of result.forecast) {
      expect(day.precipitationProbabilityPercent).toEqual({ available: false });
    }
  });

  it.each([
    undefined,
    '',
    'Fuso/Inválido',
  ])('rejeita fuso ausente ou inválido: %j', async (timezone) => {
    mockResponse({ ...forecastResponse(), timezone });
    await expect(getWeather(city)).rejects.toThrow(WeatherServiceError);
  });

  it('rejeita números não finitos sem perder zeros válidos', async () => {
    freezeTime();
    const body = forecastResponse();
    body.current.temperature_2m = NaN;
    body.current.wind_speed_10m = Infinity;
    body.daily.temperature_2m_min[0] = -Infinity;
    const response = new Response();
    vi.spyOn(response, 'json').mockResolvedValue(body);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);

    const result = await getWeather(city);
    expect(result.current.temperatureC).toEqual({ available: false });
    expect(result.current.windKmh).toEqual({ available: false });
    expect(result.forecast[0].minTemperatureC).toEqual({ available: false });
    expect(result.current.precipitationMm).toEqual({ available: true, value: 0 });
  });

  it('não presume unidades ou deslocamento UTC quando ausentes', async () => {
    freezeTime();
    mockResponse({
      ...forecastResponse(),
      current_units: undefined,
      daily_units: undefined,
      utc_offset_seconds: undefined,
    });

    const result = await getWeather(city);
    expect(result.current.temperatureC).toEqual({ available: false });
    expect(result.current.updatedAt).toBeNull();
    expect(result.forecast[0].precipitationProbabilityPercent).toEqual({ available: false });
  });

  it('usa o fuso retornado e avança o calendário ao cruzar mês e ano', async () => {
    freezeTime('2026-12-31T12:00:00Z');
    mockResponse({ ...forecastResponse(), timezone: 'Pacific/Kiritimati' });

    const result = await getWeather(city);
    expect(result.city.timezone).toBe('Pacific/Kiritimati');
    expect(result.forecast.map((day) => day.date)).toEqual([
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
      '2027-01-04',
      '2027-01-05',
    ]);
  });

  it.each([
    'inválido',
    '2026-02-30T12:00',
    '2026-10-27T25:00',
  ])('não apresenta timestamp inválido como atualização: %s', async (time) => {
    freezeTime();
    const body = forecastResponse();
    mockResponse({ ...body, current: { ...body.current, time } });
    expect((await getWeather(city)).current.updatedAt).toBeNull();
  });

  it('normaliza falhas de rede e de JSON com causa original', async () => {
    const error = new TypeError('Falha de rede');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValue(error);
    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: expect.stringContaining('Falha de rede'),
      cause: error,
    });
    fetchMock.mockImplementation(async () => new Response('{'));
    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      cause: expect.any(SyntaxError),
    });
  });
});

describe('searchCities', () => {
  it.each(['', '   ', '\t\n'])('retorna lista vazia sem acessar a rede para %j', async (name) => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities(name)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('codifica o nome e mapeia somente os campos de City, preservando a grafia', async () => {
    const fetchMock = mockResponse({ results: [{ id: 3448439, ...city }] });

    await expect(searchCities('  São Paulo & região?  ')).resolves.toEqual([city]);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      'https://geocoding-api.open-meteo.com/v1/search?name=S%C3%A3o%20Paulo%20%26%20regi%C3%A3o%3F&count=100&language=pt&format=json',
      { signal: expect.any(AbortSignal) },
    );
  });

  it('aceita cidades sem região, país ou fuso sem inventar valores', async () => {
    const minimalCity = { name: "D'Oeste", latitude: 0, longitude: 0 };
    mockResponse({ results: [minimalCity] });

    await expect(searchCities("D'Oeste")).resolves.toEqual([minimalCity]);
  });

  it.each([
    {},
    { results: [] },
  ])('retorna lista vazia para resposta sem resultados: %j', async (body) => {
    mockResponse(body);

    await expect(searchCities('Inexistente')).resolves.toEqual([]);
  });

  it('filtra candidatos inválidos antes de limitar a cinco, preservando a ordem', async () => {
    const cities = Array.from({ length: 6 }, (_, index) => ({ ...city, name: `Cidade ${index}` }));
    mockResponse({
      results: [
        null,
        { ...city, name: ' ' },
        { ...city, latitude: 91 },
        { ...city, longitude: -181 },
        { ...city, latitude: '0' },
        ...cities,
      ],
    });

    await expect(searchCities('Cidade')).resolves.toEqual(cities.slice(0, 5));
  });

  it.each([400, 429, 500])('lança WeatherServiceError para HTTP %i', async (status) => {
    mockResponse({}, status);

    await expect(searchCities('São Paulo')).rejects.toThrow(WeatherServiceError);
  });

  it.each([
    null,
    { error: true },
    { results: null },
    { results: [{}] },
  ])('não apresenta resposta inválida como lista vazia: %j', async (body) => {
    mockResponse(body);

    await expect(searchCities('São Paulo')).rejects.toThrow(WeatherServiceError);
  });

  it('normaliza falhas de rede sem convertê-las em lista vazia', async () => {
    const error = new TypeError('Falha de rede');
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(error);

    await expect(searchCities('São Paulo')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      cause: error,
    });
  });

  it('normaliza JSON inválido sem convertê-lo em lista vazia', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{'));

    await expect(searchCities('São Paulo')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      cause: expect.any(SyntaxError),
    });
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function responseWithBody(body: unknown): Response {
  const response = new Response();
  vi.spyOn(response, 'json').mockResolvedValue(body);
  return response;
}

const operations = [
  { name: 'searchCities', run: (signal?: AbortSignal) => searchCities('São Paulo', signal) },
  { name: 'getCurrentWeather', run: (signal?: AbortSignal) => getCurrentWeather(city, signal) },
  { name: 'getForecast', run: (signal?: AbortSignal) => getForecast(city, signal) },
  { name: 'getWeather', run: (signal?: AbortSignal) => getWeather(city, signal) },
];

describe('WeatherServiceError', () => {
  it('preserva assinatura antiga, causa e classificação explícita', () => {
    const cause = new Error('original');
    const legacy = new WeatherServiceError('Falha');
    expect(legacy).toBeInstanceOf(Error);
    expect(legacy).toMatchObject({
      name: 'WeatherServiceError',
      message: 'Falha',
      kind: 'network',
    });
    expect(new WeatherServiceError('Falha', { cause })).toMatchObject({ cause, kind: 'network' });
    expect(new WeatherServiceError('Falha', { cause, kind: 'http' })).toMatchObject({
      cause,
      kind: 'http',
    });
  });
});

describe.each(operations)('$name: HTTP compartilhado', ({ run }) => {
  it('classifica falha de rede e preserva causa', async () => {
    const cause = new TypeError('offline');
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(cause);
    await expect(run()).rejects.toMatchObject({ kind: 'network', cause });
  });

  it.each([400, 429, 500])('classifica HTTP %s antes de ler o corpo', async (status) => {
    const response = new Response('{', { status });
    const json = vi.spyOn(response, 'json');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
    await expect(run()).rejects.toMatchObject({
      kind: 'http',
      message: expect.stringContaining(String(status)),
    });
    expect(json).not.toHaveBeenCalled();
  });

  it('classifica erro JSON e preserva causa', async () => {
    const cause = new SyntaxError('JSON');
    const response = new Response();
    vi.spyOn(response, 'json').mockRejectedValue(cause);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
    await expect(run()).rejects.toMatchObject({ kind: 'invalid-response', cause });
  });

  it.each([
    null,
    [],
    { error: true, reason: 'Falha do provedor' },
  ])('classifica resposta inválida/provedor %j', async (body) => {
    mockResponse(body);
    await expect(run()).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('aborta previamente sem chamar fetch nem criar timer/listener', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    controller.abort('substituída');
    const add = vi.spyOn(controller.signal, 'addEventListener');
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    await expect(run(controller.signal)).rejects.toMatchObject({
      kind: 'aborted',
      cause: 'substituída',
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['fetch', 'body'])('aborta durante %s mesmo se o mock ignora abort', async (stage) => {
    vi.useFakeTimers();
    const pendingFetch = deferred<Response>();
    const pendingBody = deferred<unknown>();
    const response = new Response();
    const json = vi.spyOn(response, 'json').mockReturnValue(pendingBody.promise);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockReturnValue(pendingFetch.promise);
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, 'removeEventListener');
    const result = run(controller.signal);
    const rejected = expect(result).rejects.toMatchObject({
      kind: 'aborted',
      cause: 'nova consulta',
    });
    if (stage === 'body') {
      pendingFetch.resolve(response);
      await vi.advanceTimersByTimeAsync(0);
      expect(json).toHaveBeenCalled();
    }
    controller.abort('nova consulta');
    await rejected;
    for (const [, init] of fetchMock.mock.calls) expect(init?.signal?.aborted).toBe(true);
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(vi.getTimerCount()).toBe(0);
    // O trabalho tardio não pode transformar o cancelamento em erro de JSON/rede ou sucesso.
    pendingFetch.resolve(response);
    pendingBody.reject(new SyntaxError('corpo tardio'));
    if (stage === 'fetch') {
      // Mantém a rejeição do corpo observada caso a implementação não precise mais lê-lo.
      void pendingBody.promise.catch(() => {});
    }
    await vi.advanceTimersByTimeAsync(6000);
    await expect(result).rejects.toMatchObject({ kind: 'aborted' });
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    'fetch',
    'body',
  ])('timeout exato de 5000 ms incluindo %s e resposta tardia', async (stage) => {
    vi.useFakeTimers();
    const pendingFetch = deferred<Response>();
    const pendingBody = deferred<unknown>();
    const response = new Response();
    vi.spyOn(response, 'json').mockReturnValue(pendingBody.promise);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockReturnValue(pendingFetch.promise);
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, 'removeEventListener');
    const result = run(controller.signal);
    const rejected = expect(result).rejects.toMatchObject({ kind: 'timeout' });
    let settled = false;
    void result.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );
    if (stage === 'body') {
      await vi.advanceTimersByTimeAsync(3000);
      pendingFetch.resolve(response);
    }
    await vi.advanceTimersByTimeAsync(stage === 'body' ? 1999 : 4999);
    expect(settled).toBe(false);
    for (const [, init] of fetchMock.mock.calls) expect(init?.signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await rejected;
    for (const [, init] of fetchMock.mock.calls) expect(init?.signal?.aborted).toBe(true);
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(vi.getTimerCount()).toBe(0);
    pendingFetch.resolve(response);
    pendingBody.resolve({ ...forecastResponse(), results: [city] });
    await vi.advanceTimersByTimeAsync(10000);
    await expect(result).rejects.toMatchObject({ kind: 'timeout' });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('preserva timeout quando fetch rejeita fisicamente com AbortError', async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('abort', 'AbortError')),
            { once: true },
          );
        }),
    );
    const rejected = expect(run()).rejects.toMatchObject({ kind: 'timeout' });
    await vi.advanceTimersByTimeAsync(5000);
    await rejected;
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    'success',
    'network',
    'http',
    'json',
    'provider',
  ])('limpa timer e listener após %s', async (outcome) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-27T18:00:00Z'));
    const controller = new AbortController();
    const add = vi.spyOn(controller.signal, 'addEventListener');
    const remove = vi.spyOn(controller.signal, 'removeEventListener');
    const fetchMock = mockResponse({ ...forecastResponse(), results: [city] });
    if (outcome === 'network') fetchMock.mockRejectedValue(new TypeError('offline'));
    if (outcome === 'http')
      fetchMock.mockImplementation(async () => new Response('', { status: 500 }));
    if (outcome === 'json') fetchMock.mockImplementation(async () => new Response('{'));
    if (outcome === 'provider')
      fetchMock.mockImplementation(async () => responseWithBody({ error: true }));
    if (outcome === 'success') await run(controller.signal);
    else await expect(run(controller.signal)).rejects.toBeInstanceOf(WeatherServiceError);
    expect(vi.getTimerCount()).toBe(0);
    expect(add.mock.calls.length).toBeGreaterThan(0);
    expect(remove.mock.calls.length).toBe(add.mock.calls.length);
    for (const [, listener] of add.mock.calls)
      expect(remove).toHaveBeenCalledWith('abort', listener);
    controller.abort();
    await vi.advanceTimersByTimeAsync(6000);
    for (const [, init] of fetchMock.mock.calls) expect(init?.signal?.aborted).toBe(false);
  });
});

describe('serviços independentes e validação de seções', () => {
  it('current não solicita nem valida daily, timezone ou timestamp', async () => {
    const { current, current_units } = forecastResponse();
    const fetchMock = mockResponse({ current, current_units, daily: null, timezone: 'Inválido' });
    expect((await getCurrentWeather(city)).temperatureC).toEqual({ available: true, value: 22.4 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const params = new URL(String(fetchMock.mock.calls[0][0])).searchParams;
    expect(params.has('current')).toBe(true);
    expect(params.has('daily')).toBe(false);
  });

  it('daily não solicita nem valida current e usa o fuso da resposta, não da cidade', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-28T01:00:00Z'));
    const { daily, daily_units } = forecastResponse();
    const fetchMock = mockResponse({ daily, daily_units, current: null, timezone: 'Asia/Tokyo' });
    const result = await getForecast(city);
    expect(result).toHaveLength(5);
    expect(result[0].date).toBe('2026-10-28');
    expect(result[0].minTemperatureC).toEqual({ available: true, value: 19 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const params = new URL(String(fetchMock.mock.calls[0][0])).searchParams;
    expect(params.has('current')).toBe(false);
    expect(params.has('daily')).toBe(true);
  });

  it.each([
    undefined,
    null,
    '',
    'Fuso/Inválido',
    123,
  ])('daily falha com timezone %j apesar do fuso na cidade', async (timezone) => {
    mockResponse({ ...forecastResponse(), timezone });
    await expect(getForecast(city)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it.each([
    undefined,
    null,
    [],
    'inválido',
  ])('cada serviço rejeita sua seção inválida %j', async (section) => {
    mockResponse({ ...forecastResponse(), current: section, daily: section });
    await expect(getCurrentWeather(city)).rejects.toMatchObject({ kind: 'invalid-response' });
    await expect(getForecast(city)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it.each([undefined, null, {}, 'inválido'])('daily exige time como array: %j', async (time) => {
    mockResponse({ ...forecastResponse(), daily: { time } });
    await expect(getForecast(city)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('daily vazio preserva exatamente cinco datas e campos indisponíveis', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-27T18:00:00Z'));
    mockResponse({ timezone: 'UTC', daily: { time: [] } });
    const days = await getForecast(city);
    expect(days.map(({ date }) => date)).toEqual(forecastResponse().daily.time);
    for (const day of days) {
      for (const [key, field] of Object.entries(day)) {
        if (key !== 'date') expect(field).toEqual({ available: false });
      }
    }
  });

  it.each([
    undefined,
    null,
    NaN,
    Infinity,
    -Infinity,
    '0',
  ])('não inventa números para campos %s', async (value) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-27T18:00:00Z'));
    const body = forecastResponse();
    const current = Object.fromEntries(Object.keys(body.current).map((key) => [key, value]));
    const daily = Object.fromEntries(
      Object.keys(body.daily)
        .filter((key) => key !== 'time')
        .map((key) => [key, [value]]),
    );
    const response = responseWithBody({
      ...body,
      current,
      daily: { ...daily, time: body.daily.time },
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
    const result = await getWeather(city);
    expect(result.current.updatedAt).toBeNull();
    for (const [key, field] of Object.entries(result.current)) {
      if (key !== 'updatedAt') expect(field).toEqual({ available: false });
    }
    for (const [key, field] of Object.entries(result.forecast[0])) {
      if (key !== 'date') expect(field).toEqual({ available: false });
    }
  });

  it.each([
    undefined,
    null,
    'invalid',
    '2026-02-30T12:00',
    '2026-10-27T14:00',
  ])('nunca trata current.time %j como atualização do modelo', async (time) => {
    const body = forecastResponse();
    mockResponse({ ...body, current: { ...body.current, time } });
    expect((await getCurrentWeather(city)).updatedAt).toBeNull();
  });

  it('marca unidades numéricas desconhecidas e ausentes como indisponíveis', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-27T18:00:00Z'));
    const body = forecastResponse();
    mockResponse({
      ...body,
      current_units: Object.fromEntries(Object.keys(body.current_units).map((key) => [key, '?'])),
      daily_units: {},
    });
    const result = await getWeather(city);
    for (const [key, field] of Object.entries(result.current)) {
      if (key !== 'updatedAt' && key !== 'conditionLabel')
        expect(field).toEqual({ available: false });
    }
    for (const day of result.forecast) {
      for (const [key, field] of Object.entries(day)) {
        if (key !== 'date' && key !== 'conditionLabel') expect(field).toEqual({ available: false });
      }
    }
  });

  it('não filtra ou reindexa time antes de mapear os arrays paralelos', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-27T18:00:00Z'));
    const body = forecastResponse();
    mockResponse({
      ...body,
      daily: {
        ...body.daily,
        time: ['inválido', '2026-10-29', null, '2026-10-27', '2026-10-31'],
        temperature_2m_min: [999, 20, 999, 18, 22],
      },
    });
    const days = await getForecast(city);
    expect(days.map(({ date }) => date)).toEqual(body.daily.time);
    expect(days.map(({ minTemperatureC }) => minTemperatureC)).toEqual([
      { available: true, value: 18 },
      { available: false },
      { available: true, value: 20 },
      { available: false },
      { available: true, value: 22 },
    ]);
  });

  it('todos os candidatos inválidos são erro invalid-response, nunca vazio', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      responseWithBody({
        results: [
          { ...city, name: '' },
          { ...city, latitude: NaN },
          { ...city, longitude: Infinity },
        ],
      }),
    );
    await expect(searchCities('Cidade')).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it.each([
    { ...city, name: ' ' },
    { ...city, latitude: NaN },
    { ...city, longitude: 181 },
  ])('rejeita cidade inválida antes da rede', async (invalidCity) => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    await expect(getCurrentWeather(invalidCity)).rejects.toMatchObject({
      kind: 'invalid-response',
    });
    await expect(getForecast(invalidCity)).rejects.toMatchObject({ kind: 'invalid-response' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('fronteiras dos campos meteorológicos', () => {
  it('preserva zeros numéricos, WMO zero e percentuais em 100', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-27T18:00:00Z'));
    const body = forecastResponse();
    const current = Object.fromEntries(Object.keys(body.current).map((key) => [key, 0]));
    const daily = Object.fromEntries(
      Object.keys(body.daily)
        .filter((key) => key !== 'time')
        .map((key) => [key, [0, 0, 0, 0, 0]]),
    );
    mockResponse({
      ...body,
      current: { ...current, relative_humidity_2m: 100 },
      daily: {
        ...daily,
        time: body.daily.time,
        precipitation_probability_max: [0, 100, 0, 0, 0],
      },
    });
    const result = await getWeather(city);
    expect(result.current.humidityPercent).toEqual({ available: true, value: 100 });
    expect(result.current.conditionLabel).toEqual({ available: true, value: 'Céu limpo' });
    for (const [key, field] of Object.entries(result.current)) {
      if (!['updatedAt', 'conditionLabel', 'humidityPercent'].includes(key)) {
        expect(field).toEqual({ available: true, value: 0 });
      }
    }
    for (const [key, field] of Object.entries(result.forecast[0])) {
      if (key !== 'date' && key !== 'conditionLabel')
        expect(field).toEqual({ available: true, value: 0 });
    }
    expect(result.forecast[1].precipitationProbabilityPercent).toEqual({
      available: true,
      value: 100,
    });
  });

  it('mantém temperaturas negativas e rejeita vento, pressão e precipitação negativos', async () => {
    const body = forecastResponse();
    mockResponse({
      ...body,
      current: {
        ...body.current,
        temperature_2m: -10,
        relative_humidity_2m: -1,
        wind_speed_10m: -1,
        surface_pressure: -1,
        precipitation: -1,
      },
    });
    const result = await getCurrentWeather(city);
    expect(result.temperatureC).toEqual({ available: true, value: -10 });
    expect(result.humidityPercent).toEqual({ available: false });
    expect(result.windKmh).toEqual({ available: false });
    expect(result.pressureHpa).toEqual({ available: false });
    expect(result.precipitationMm).toEqual({ available: false });
  });
});

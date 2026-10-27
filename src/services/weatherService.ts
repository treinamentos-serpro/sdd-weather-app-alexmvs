import { getForecastDates } from '../lib/dates';
import { filterValidCities, isValidCityName, isValidCoordinates } from '../lib/validation';
import { getWeatherLabel } from '../lib/weatherCodes';
import type {
  City,
  CurrentWeather,
  ForecastDay,
  WeatherData,
  WeatherField,
} from '../types/weather';

type WeatherServiceErrorKind = 'network' | 'http' | 'invalid-response' | 'timeout' | 'aborted';

export class WeatherServiceError extends Error {
  readonly kind: WeatherServiceErrorKind;

  constructor(message: string, options?: ErrorOptions & { kind?: WeatherServiceErrorKind }) {
    super(message, options);
    this.name = 'WeatherServiceError';
    this.kind = options?.kind ?? 'network';
  }
}

async function requestJson(url: string, operation: string, signal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  const abortError = () =>
    new WeatherServiceError('Requisição cancelada.', {
      kind: 'aborted',
      cause: signal?.reason,
    });
  if (signal?.aborted) throw abortError();

  let cancel: () => void = () => {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancellation = new Promise<never>((_, reject) => {
    cancel = () => {
      const error = abortError();
      reject(error);
      controller.abort(error);
    };
    signal?.addEventListener('abort', cancel, { once: true });
    timer = setTimeout(() => {
      const error = new WeatherServiceError(`Tempo esgotado ao ${operation}. Tente novamente.`, {
        kind: 'timeout',
      });
      reject(error);
      controller.abort(error);
    }, 5000);
  });

  const request = async (): Promise<unknown> => {
    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (cause) {
      throw new WeatherServiceError(`Falha de rede ao ${operation}. Tente novamente.`, {
        kind: 'network',
        cause,
      });
    }
    controller.signal.throwIfAborted();
    if (!response.ok) {
      throw new WeatherServiceError(`Não foi possível ${operation} (HTTP ${response.status}).`, {
        kind: 'http',
      });
    }
    try {
      return await response.json();
    } catch (cause) {
      throw new WeatherServiceError(`Resposta JSON inválida ao ${operation}.`, {
        kind: 'invalid-response',
        cause,
      });
    }
  };

  try {
    // A corrida conclui mesmo quando fetch/json ignoram o cancelamento físico.
    return await Promise.race([cancellation, request()]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalidResponse(message: string): WeatherServiceError {
  return new WeatherServiceError(message, { kind: 'invalid-response' });
}

export async function searchCities(name: string, signal?: AbortSignal): Promise<City[]> {
  if (!isValidCityName(name)) return [];
  const data = await requestJson(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name.trim())}&count=100&language=pt&format=json`,
    'pesquisar cidades',
    signal,
  );
  if (!isRecord(data) || data.error === true) {
    throw invalidResponse('Resposta inválida do serviço de busca de cidades.');
  }
  if (data.results === undefined) return [];
  if (!Array.isArray(data.results)) {
    throw invalidResponse('Lista de cidades inválida na resposta do serviço.');
  }
  const cities = filterValidCities(data.results);
  if (data.results.length > 0 && cities.length === 0) {
    throw invalidResponse('Não foi possível identificar as cidades retornadas.');
  }
  return cities;
}

function numberField(
  value: unknown,
  unit: unknown,
  expectedUnit: string,
  min = -Infinity,
  max = Infinity,
): WeatherField<number> {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max &&
    unit === expectedUnit
    ? { available: true, value }
    : { available: false };
}

function conditionField(value: unknown): WeatherField<string> {
  const label = getWeatherLabel(value);
  return label === null ? { available: false } : { available: true, value: label };
}

function weatherParams(city: City): URLSearchParams {
  if (!isValidCityName(city.name) || !isValidCoordinates(city.latitude, city.longitude)) {
    throw invalidResponse('Localidade inválida para consultar o clima.');
  }
  return new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    timezone: 'auto',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
    timeformat: 'iso8601',
  });
}

export async function getCurrentWeather(city: City, signal?: AbortSignal): Promise<CurrentWeather> {
  const params = weatherParams(city);
  params.set(
    'current',
    'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,surface_pressure',
  );
  const data = await requestJson(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    'consultar as condições atuais',
    signal,
  );
  if (!isRecord(data) || data.error === true || !isRecord(data.current)) {
    throw invalidResponse('Resposta incompleta do serviço de clima: current inválido.');
  }
  const current = data.current;
  const currentUnits = isRecord(data.current_units) ? data.current_units : {};
  return {
    temperatureC: numberField(current.temperature_2m, currentUnits.temperature_2m, '°C'),
    conditionLabel: conditionField(current.weather_code),
    humidityPercent: numberField(
      current.relative_humidity_2m,
      currentUnits.relative_humidity_2m,
      '%',
      0,
      100,
    ),
    windKmh: numberField(current.wind_speed_10m, currentUnits.wind_speed_10m, 'km/h', 0),
    pressureHpa: numberField(current.surface_pressure, currentUnits.surface_pressure, 'hPa', 0),
    precipitationMm: numberField(current.precipitation, currentUnits.precipitation, 'mm', 0),
    // current.time é o horário dos dados modelados, não a atualização do modelo.
    updatedAt: null,
  };
}

async function requestForecast(
  city: City,
  signal?: AbortSignal,
): Promise<{
  forecast: ForecastDay[];
  timezone: string;
}> {
  const params = weatherParams(city);
  params.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max',
  );
  params.set('forecast_days', '5');
  const data = await requestJson(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    'consultar a previsão',
    signal,
  );
  if (
    !isRecord(data) ||
    data.error === true ||
    !isRecord(data.daily) ||
    !Array.isArray(data.daily.time)
  ) {
    throw invalidResponse('Resposta incompleta do serviço de clima: daily inválido.');
  }
  const dates = getForecastDates(data.timezone, new Date());
  if (!dates || typeof data.timezone !== 'string') {
    throw invalidResponse('Fuso horário ausente ou inválido na resposta da previsão.');
  }
  const daily = data.daily;
  const dailyUnits = isRecord(data.daily_units) ? data.daily_units : {};
  const times: unknown[] = data.daily.time;
  const forecast = dates.map((date): ForecastDay => {
    const index = times.indexOf(date);
    const value = (key: string): unknown =>
      Array.isArray(daily[key]) ? daily[key][index] : undefined;
    return {
      date,
      minTemperatureC: numberField(
        value('temperature_2m_min'),
        dailyUnits.temperature_2m_min,
        '°C',
      ),
      maxTemperatureC: numberField(
        value('temperature_2m_max'),
        dailyUnits.temperature_2m_max,
        '°C',
      ),
      conditionLabel: conditionField(value('weather_code')),
      precipitationProbabilityPercent: numberField(
        value('precipitation_probability_max'),
        dailyUnits.precipitation_probability_max,
        '%',
        0,
        100,
      ),
      precipitationMm: numberField(
        value('precipitation_sum'),
        dailyUnits.precipitation_sum,
        'mm',
        0,
      ),
      windKmh: numberField(value('wind_speed_10m_max'), dailyUnits.wind_speed_10m_max, 'km/h', 0),
    };
  });
  return { forecast, timezone: data.timezone };
}

export async function getForecast(city: City, signal?: AbortSignal): Promise<ForecastDay[]> {
  return (await requestForecast(city, signal)).forecast;
}

/** Adaptador legado; as duas seções usam requisições e validações independentes. */
export async function getWeather(city: City, signal?: AbortSignal): Promise<WeatherData> {
  const [current, { forecast, timezone }] = await Promise.all([
    getCurrentWeather(city, signal),
    requestForecast(city, signal),
  ]);
  return { city: { ...city, timezone }, current, forecast };
}

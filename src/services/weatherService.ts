import type { City } from '../types/weather';

export class WeatherServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toCity(value: unknown): City | null {
  if (
    !isRecord(value) ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    typeof value.latitude !== 'number' ||
    !Number.isFinite(value.latitude) ||
    value.latitude < -90 ||
    value.latitude > 90 ||
    typeof value.longitude !== 'number' ||
    !Number.isFinite(value.longitude) ||
    value.longitude < -180 ||
    value.longitude > 180
  ) {
    return null;
  }

  return {
    name: value.name,
    latitude: value.latitude,
    longitude: value.longitude,
    ...(typeof value.admin1 === 'string' ? { admin1: value.admin1 } : {}),
    ...(typeof value.country === 'string' ? { country: value.country } : {}),
    ...(typeof value.timezone === 'string' ? { timezone: value.timezone } : {}),
  };
}

export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) {
    return [];
  }

  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=100&language=pt&format=json`,
  );
  if (!response.ok) {
    throw new WeatherServiceError(`Não foi possível pesquisar cidades (HTTP ${response.status}).`);
  }

  const data: unknown = await response.json();
  if (!isRecord(data) || data.error === true) {
    throw new WeatherServiceError('Resposta inválida do serviço de busca de cidades.');
  }
  if (data.results === undefined) {
    return [];
  }
  if (!Array.isArray(data.results)) {
    throw new WeatherServiceError('Lista de cidades inválida na resposta do serviço.');
  }

  const cities = data.results.map(toCity).filter((city) => city !== null);
  if (data.results.length > 0 && cities.length === 0) {
    throw new WeatherServiceError('Não foi possível identificar as cidades retornadas.');
  }
  return cities.slice(0, 5);
}

import type { City } from '../types/weather';

export function isValidCityName(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidCoordinates(latitude: unknown, longitude: unknown): boolean {
  return (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/** Filtra antes de limitar; copia apenas os campos do contrato de City. */
export function filterValidCities(values: readonly unknown[]): City[] {
  const cities: City[] = [];
  for (const value of values) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) continue;
    const candidate = value as Record<string, unknown>;
    const { name, latitude, longitude } = candidate;
    if (
      !isValidCityName(name) ||
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      !isValidCoordinates(latitude, longitude)
    )
      continue;
    cities.push({
      name,
      latitude,
      longitude,
      ...(typeof candidate.admin1 === 'string' ? { admin1: candidate.admin1 } : {}),
      ...(typeof candidate.country === 'string' ? { country: candidate.country } : {}),
      ...(typeof candidate.timezone === 'string' ? { timezone: candidate.timezone } : {}),
    });
    if (cities.length === 5) break;
  }
  return cities;
}

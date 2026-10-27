import type { City, WeatherData } from '../types/weather';
import { mockWeatherData } from './weather';

export const mockCatalog: WeatherData[] = [
  mockWeatherData,
  {
    city: {
      name: 'Salvador',
      admin1: 'Localidade de teste (fictícia)',
      country: 'Demonstração',
      latitude: -10,
      longitude: -40,
      timezone: 'America/Bahia',
    },
    current: {
      ...mockWeatherData.current,
      temperatureC: { available: true, value: 12.4 },
    },
    forecast: mockWeatherData.forecast.map((day) => ({
      ...day,
      minTemperatureC: { available: true, value: 8 },
      maxTemperatureC: { available: true, value: 16 },
    })),
  },
];

export function isSameCity(first: City, second: City): boolean {
  return (
    first.name === second.name &&
    first.latitude === second.latitude &&
    first.longitude === second.longitude
  );
}

export function findMockData(city: City): WeatherData {
  const data = mockCatalog.find((item) => isSameCity(item.city, city));
  if (!data) throw new Error('Localidade não encontrada no catálogo de demonstração.');
  return data;
}

export function searchMockCities(query: string): City[] {
  return mockCatalog
    .map(({ city }) => city)
    .filter(
      (city) =>
        city.name.trim() !== '' &&
        Number.isFinite(city.latitude) &&
        Math.abs(city.latitude) <= 90 &&
        Number.isFinite(city.longitude) &&
        Math.abs(city.longitude) <= 180 &&
        city.name.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')),
    )
    .slice(0, 5);
}

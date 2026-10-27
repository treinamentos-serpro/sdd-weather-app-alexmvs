import type { WeatherData } from '../types/weather';

/** Dados fictícios e datas fixas para desenvolver a UI sem chamadas de rede. */
export const mockWeatherData: WeatherData = {
  city: {
    name: 'Salvador',
    admin1: 'Bahia',
    country: 'Brasil',
    latitude: -12.9714,
    longitude: -38.5014,
    timezone: 'America/Bahia',
  },
  current: {
    temperatureC: { available: true, value: 25.4 },
    conditionLabel: { available: true, value: 'Parcialmente nublado' },
    humidityPercent: { available: true, value: 68 },
    windKmh: { available: true, value: 12.6 },
    pressureHpa: { available: true, value: 1013.2 },
    precipitationMm: { available: true, value: 0 },
    updatedAt: '2026-10-27T15:00:00-03:00',
  },
  forecast: [
    {
      date: '2026-10-27',
      precipitationProbabilityPercent: { available: true, value: 10 },
      minTemperatureC: { available: true, value: 18.2 },
      maxTemperatureC: { available: true, value: 27.5 },
      conditionLabel: { available: true, value: 'Parcialmente nublado' },
      precipitationMm: { available: true, value: 0 },
      windKmh: { available: true, value: 15.3 },
    },
    {
      date: '2026-10-28',
      precipitationProbabilityPercent: { available: true, value: 0 },
      minTemperatureC: { available: true, value: 19.1 },
      maxTemperatureC: { available: true, value: 29.3 },
      conditionLabel: { available: true, value: 'Céu limpo' },
      precipitationMm: { available: true, value: 0 },
      windKmh: { available: true, value: 11.8 },
    },
    {
      date: '2026-10-29',
      precipitationProbabilityPercent: { available: true, value: 80 },
      minTemperatureC: { available: true, value: 20.3 },
      maxTemperatureC: { available: true, value: 26.1 },
      conditionLabel: { available: true, value: 'Chuva leve' },
      precipitationMm: { available: true, value: 4.2 },
      windKmh: { available: true, value: 18.4 },
    },
    {
      date: '2026-10-30',
      precipitationProbabilityPercent: { available: true, value: 20 },
      minTemperatureC: { available: true, value: 17.8 },
      maxTemperatureC: { available: true, value: 23.6 },
      conditionLabel: { available: true, value: 'Encoberto' },
      precipitationMm: { available: true, value: 0 },
      windKmh: { available: true, value: 14.7 },
    },
    {
      date: '2026-10-31',
      precipitationProbabilityPercent: { available: true, value: 0 },
      minTemperatureC: { available: true, value: 16.5 },
      maxTemperatureC: { available: true, value: 25.8 },
      conditionLabel: { available: true, value: 'Céu limpo' },
      precipitationMm: { available: true, value: 0 },
      windKmh: { available: true, value: 10.2 },
    },
  ],
};

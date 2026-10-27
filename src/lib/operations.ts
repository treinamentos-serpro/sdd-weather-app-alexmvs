import type { WeatherOperation } from '../types/weather';

export const operationLabels: Record<WeatherOperation, string> = {
  search: 'Busca de cidades',
  current: 'Condições meteorológicas',
  forecast: 'Previsão diária',
};

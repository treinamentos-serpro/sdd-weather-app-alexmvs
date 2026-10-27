import type { Unit } from '../types/weather';

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function fahrenheitToCelsius(fahrenheit: number): number {
  return ((fahrenheit - 32) * 5) / 9;
}

export function formatTemperature(temperatureC: number, unit: Unit): string {
  if (!Number.isFinite(temperatureC)) {
    throw new RangeError('A temperatura deve ser um número finito.');
  }

  const value = unit === 'fahrenheit' ? celsiusToFahrenheit(temperatureC) : temperatureC;
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);

  return `${formatted} ${unit === 'fahrenheit' ? '°F' : '°C'}`;
}

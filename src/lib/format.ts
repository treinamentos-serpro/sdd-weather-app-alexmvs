import type { WeatherField } from '../types/weather';

export function formatDayLabel(date: string): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new RangeError('A data deve ser uma data válida no formato YYYY-MM-DD.');
  }

  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

export function formatMetric(field: WeatherField<number>, suffix: string): string {
  return field.available
    ? `${new Intl.NumberFormat('pt-BR').format(field.value)} ${suffix}`
    : 'Indisponível';
}

import { useId } from 'react';
import { formatDayLabel, formatMetric } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherIcon } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

export interface ForecastCardProps {
  day: ForecastDay;
  unit: Unit;
}

export default function ForecastCard({ day, unit }: ForecastCardProps) {
  const headingId = useId();
  const icon = day.conditionLabel.available ? getWeatherIcon(day.conditionLabel.value) : null;
  const metrics = [
    {
      label: 'Máxima',
      value: day.maxTemperatureC.available
        ? formatTemperature(day.maxTemperatureC.value, unit)
        : 'Indisponível',
    },
    {
      label: 'Mínima',
      value: day.minTemperatureC.available
        ? formatTemperature(day.minTemperatureC.value, unit)
        : 'Indisponível',
    },
    {
      label: 'Probabilidade de chuva',
      value: formatMetric(day.precipitationProbabilityPercent, '%'),
    },
    { label: 'Precipitação', value: formatMetric(day.precipitationMm, 'mm') },
    { label: 'Vento', value: formatMetric(day.windKmh, 'km/h') },
  ];

  return (
    <article
      aria-labelledby={headingId}
      className="h-full min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 font-sans text-white shadow-glass backdrop-blur-md [overflow-wrap:anywhere]"
    >
      <h3 id={headingId} className="text-sm font-semibold text-slate-200">
        <time dateTime={day.date}>{formatDayLabel(day.date)}</time>
      </h3>
      {icon && (
        <span aria-hidden="true" className="my-3 block text-4xl text-sun">
          {icon}
        </span>
      )}
      <p className="my-3 text-sm text-slate-300">
        <span className="sr-only">Condição: </span>
        {day.conditionLabel.available ? day.conditionLabel.value : 'Indisponível'}
      </p>
      <dl className="space-y-3">
        {metrics.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-sm text-slate-300">{label}</dt>
            <dd className="break-words font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

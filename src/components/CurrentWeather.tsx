import { useId } from 'react';
import { formatMetric } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherIcon } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

export interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const headingId = useId();
  const icon = current.conditionLabel.available
    ? getWeatherIcon(current.conditionLabel.value)
    : null;
  const updatedAtMs = current.updatedAt === null ? Number.NaN : Date.parse(current.updatedAt);
  const hasTimestamp = Number.isFinite(updatedAtMs);
  const isStale = hasTimestamp && Date.now() - updatedAtMs > 60 * 60 * 1000;
  const metrics = [
    { label: 'Umidade', value: formatMetric(current.humidityPercent, '%') },
    { label: 'Vento', value: formatMetric(current.windKmh, 'km/h') },
    { label: 'Precipitação', value: formatMetric(current.precipitationMm, 'mm') },
    { label: 'Pressão', value: formatMetric(current.pressureHpa, 'hPa') },
  ];

  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0 rounded-3xl border border-white/10 bg-white/5 p-6 font-sans text-white shadow-glass backdrop-blur-md [overflow-wrap:anywhere] sm:p-8"
    >
      <header>
        <h2 id={headingId} className="text-2xl font-semibold sm:text-3xl">
          {city.name}
        </h2>
        {(city.admin1 || city.country) && (
          <p className="mt-1 text-slate-300">
            {[city.admin1, city.country].filter(Boolean).join(', ')}
          </p>
        )}
      </header>

      <div className="my-6 flex flex-wrap items-center gap-4 sm:gap-6">
        {icon && (
          <span aria-hidden="true" className="text-6xl text-sun sm:text-7xl">
            {icon}
          </span>
        )}
        <div className="min-w-0 max-w-full">
          <p className="sr-only">Temperatura</p>
          <p className="text-5xl font-semibold tracking-tight sm:text-7xl">
            {current.temperatureC.available
              ? formatTemperature(current.temperatureC.value, unit)
              : 'Indisponível'}
          </p>
          <p className="mt-2 text-lg text-slate-300">
            <span className="sr-only">Condição: </span>
            {current.conditionLabel.available ? current.conditionLabel.value : 'Indisponível'}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map(({ label, value }) => (
          <div key={label} className="min-w-0 rounded-xl border border-white/10 bg-white/5 p-3">
            <dt className="text-sm text-slate-300">{label}</dt>
            <dd className="mt-1 text-lg font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <footer className="mt-6 text-sm text-slate-300">
        {hasTimestamp && current.updatedAt !== null ? (
          <p>
            Dados de <time dateTime={current.updatedAt}>{current.updatedAt}</time>
          </p>
        ) : (
          <p>Horário de atualização desconhecido.</p>
        )}
        {isStale && (
          <p className="mt-1 text-amber-300">Dados desatualizados (há mais de 1 hora).</p>
        )}
      </footer>
    </section>
  );
}

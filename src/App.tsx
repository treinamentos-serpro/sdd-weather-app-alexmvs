import { useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import DataDisclosure from './components/DataDisclosure';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import SearchFeedback from './components/SearchFeedback';
import UnitToggle from './components/UnitToggle';
import WeatherSection from './components/WeatherSection';
import useWeather from './hooks/useWeather';
import type { Unit } from './types/weather';

export default function App() {
  const weather = useWeather();
  const [unit, setUnit] = useState<Unit>('celsius');
  const headerRef = useRef<HTMLElement>(null);
  function editSearch() {
    const input = headerRef.current?.querySelector<HTMLInputElement>('input[name="city"]');
    input?.focus();
    input?.select();
  }

  return (
    <div className="min-h-screen bg-night-900 font-sans text-white">
      <a
        href="#weather-content"
        className="sr-only rounded-lg bg-accent-400 p-3 text-night-900 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10"
      >
        Ir para o conteúdo
      </a>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <DataDisclosure />
        <header
          ref={headerRef}
          className="grid items-center gap-6 lg:grid-cols-[auto_minmax(0,1fr)_auto]"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-accent-400">Weather</span> App
            </h1>
            <p className="mt-1 text-sm text-slate-300">O clima em um só lugar</p>
          </div>
          <SearchBar
            query={weather.query}
            onQueryChange={weather.changeQuery}
            suggestions={weather.suggestions}
            onSelect={weather.selectCity}
            onSearch={weather.search}
          />
          <UnitToggle unit={unit} onChange={setUnit} />
        </header>
        <p aria-live="polite" aria-atomic="true" className="sr-only">
          {weather.selectedCity
            ? `Localidade selecionada: ${weather.selectedCity.name}, ${weather.selectedCity.admin1 ?? weather.selectedCity.country ?? ''}.`
            : ''}
        </p>
        <main
          id="weather-content"
          aria-label="Clima e previsão"
          tabIndex={-1}
          className="min-h-40 min-w-0 space-y-8 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-400"
        >
          {!weather.selectedCity && (
            <SearchFeedback
              status={weather.searchStatus}
              invalid={false}
              count={weather.suggestions.length}
              message={weather.searchError?.message}
              onEdit={editSearch}
              onRetry={weather.retrySearch}
            />
          )}
          {weather.selectedCity && (
            <>
              <p className="text-slate-300 [overflow-wrap:anywhere]">
                Localidade selecionada: {weather.selectedCity.name},{' '}
                {[weather.selectedCity.admin1, weather.selectedCity.country]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <WeatherSection
                operation="current"
                state={weather.current}
                onRetry={weather.retryCurrent}
                onEdit={editSearch}
              >
                {weather.current.data && (
                  <CurrentWeather
                    city={weather.selectedCity}
                    current={weather.current.data}
                    unit={unit}
                  />
                )}
              </WeatherSection>
              <WeatherSection
                operation="forecast"
                state={weather.forecast}
                onRetry={weather.retryForecast}
                onEdit={editSearch}
              >
                {weather.forecast.data && (
                  <ForecastList forecast={weather.forecast.data} unit={unit} />
                )}
              </WeatherSection>
            </>
          )}
        </main>
        <footer className="border-t border-white/10 pt-4 text-sm text-slate-400">
          Dados meteorológicos por{' '}
          <a className="underline" href="https://open-meteo.com/">
            Open-Meteo
          </a>
          .
        </footer>
      </div>
    </div>
  );
}

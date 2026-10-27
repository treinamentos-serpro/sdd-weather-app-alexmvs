import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CurrentWeather from '../../../src/components/CurrentWeather';
import { mockWeatherData } from '../../../src/mocks/weather';
import type { CurrentWeather as CurrentWeatherData } from '../../../src/types/weather';

const { city, current } = mockWeatherData;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-27T18:30:00Z'));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('CurrentWeather', () => {
  it('exibe cidade, condição, temperatura e métricas com unidades', () => {
    render(<CurrentWeather city={city} current={current} unit="celsius" />);

    expect(screen.getByRole('region', { name: city.name })).toBeInTheDocument();
    expect(screen.getByText('Bahia, Brasil')).toBeInTheDocument();
    expect(screen.getByText('25,4 °C')).toBeInTheDocument();
    expect(screen.getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(screen.getByText('⛅')).toHaveAttribute('aria-hidden', 'true');
    for (const [label, value] of [
      ['Umidade', '68 %'],
      ['Vento', '12,6 km/h'],
      ['Precipitação', '0 mm'],
      ['Pressão', '1.013,2 hPa'],
    ]) {
      const metric = screen.getByText(label).parentElement;
      expect(metric).not.toBeNull();
      expect(within(metric!).getByRole('definition')).toHaveTextContent(value);
    }
    expect(screen.getByText(current.updatedAt!)).toHaveAttribute('datetime', current.updatedAt);
    expect(screen.queryByText(/Dados desatualizados/)).not.toBeInTheDocument();
  });

  it('alterna a unidade a partir da origem sem modificar outras métricas', () => {
    const { rerender } = render(<CurrentWeather city={city} current={current} unit="celsius" />);
    rerender(<CurrentWeather city={city} current={current} unit="fahrenheit" />);
    expect(screen.getByText('77,7 °F')).toBeInTheDocument();
    expect(screen.getByText('12,6 km/h')).toBeInTheDocument();
    rerender(<CurrentWeather city={city} current={current} unit="celsius" />);
    expect(screen.getByText('25,4 °C')).toBeInTheDocument();
  });

  it('identifica todos os campos ausentes sem inventar valores ou ícones', () => {
    const unavailable: CurrentWeatherData = {
      temperatureC: { available: false },
      conditionLabel: { available: false },
      humidityPercent: { available: false },
      windKmh: { available: false },
      precipitationMm: { available: false },
      pressureHpa: { available: false },
      updatedAt: null,
    };
    render(
      <CurrentWeather
        city={{ name: 'Recife', latitude: -8, longitude: -35 }}
        current={unavailable}
        unit="fahrenheit"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Recife' })).toBeInTheDocument();
    expect(screen.getAllByText('Indisponível')).toHaveLength(6);
    expect(screen.getByText('Horário de atualização desconhecido.')).toBeInTheDocument();
    expect(screen.queryByText('⛅')).not.toBeInTheDocument();
    expect(screen.queryByText(/0 °F|0 mm|0 %/)).not.toBeInTheDocument();
  });

  it('preserva dados válidos quando só um campo está indisponível', () => {
    render(
      <CurrentWeather
        city={city}
        current={{ ...current, pressureHpa: { available: false } }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('Indisponível')).toBeInTheDocument();
    expect(screen.getByText('25,4 °C')).toBeInTheDocument();
    expect(screen.getByText('0 mm')).toBeInTheDocument();
  });

  it.each([
    ['2026-10-27T17:30:00Z', false],
    ['2026-10-27T17:29:59Z', true],
  ])('avisa desatualização somente acima de uma hora (%s)', (updatedAt, stale) => {
    render(<CurrentWeather city={city} current={{ ...current, updatedAt }} unit="celsius" />);
    expect(Boolean(screen.queryByText(/Dados desatualizados/))).toBe(stale);
  });

  it('não infere ícone para um rótulo desconhecido', () => {
    render(
      <CurrentWeather
        city={city}
        current={{
          ...current,
          conditionLabel: { available: true, value: 'Condição desconhecida' },
        }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('Condição desconhecida')).toBeInTheDocument();
    expect(screen.queryByText('⛅')).not.toBeInTheDocument();
  });
});

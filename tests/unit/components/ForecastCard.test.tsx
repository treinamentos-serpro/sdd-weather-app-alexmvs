import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ForecastCard from '../../../src/components/ForecastCard';
import { mockWeatherData } from '../../../src/mocks/weather';
import type { ForecastDay } from '../../../src/types/weather';

afterEach(cleanup);

const day: ForecastDay = {
  date: '2026-10-27',
  minTemperatureC: { available: true, value: 10 },
  maxTemperatureC: { available: true, value: 20 },
  conditionLabel: { available: true, value: 'Céu limpo' },
  precipitationProbabilityPercent: { available: true, value: 0 },
  precipitationMm: { available: true, value: 0 },
  windKmh: { available: true, value: 12.6 },
};

function expectMetric(label: string, value: string) {
  const term = screen.getByText(label);
  expect(term.parentElement).not.toBeNull();
  expect(within(term.parentElement!).getByRole('definition')).toHaveTextContent(value);
}

describe('ForecastCard', () => {
  it('exibe data local, ícone decorativo, condição e métricas independentes', () => {
    render(<ForecastCard day={day} unit="celsius" />);

    expect(screen.getByRole('article', { name: 'ter., 27/10/2026' })).toBeInTheDocument();
    expect(screen.getByText('ter., 27/10/2026')).toHaveAttribute('datetime', day.date);
    expect(screen.getByText('Céu limpo')).toBeInTheDocument();
    expect(screen.getByText('☀️')).toHaveAttribute('aria-hidden', 'true');
    expectMetric('Máxima', '20,0 °C');
    expectMetric('Mínima', '10,0 °C');
    expectMetric('Probabilidade de chuva', '0 %');
    expectMetric('Precipitação', '0 mm');
    expectMetric('Vento', '12,6 km/h');
  });

  it('converte máxima/mínima da origem e preserva os demais campos', () => {
    const { rerender } = render(<ForecastCard day={day} unit="celsius" />);
    rerender(<ForecastCard day={day} unit="fahrenheit" />);
    expectMetric('Máxima', '68,0 °F');
    expectMetric('Mínima', '50,0 °F');
    expectMetric('Probabilidade de chuva', '0 %');
    expectMetric('Vento', '12,6 km/h');
    rerender(<ForecastCard day={day} unit="celsius" />);
    expectMetric('Máxima', '20,0 °C');
  });

  it.each([0, 100])('preserva a probabilidade limite %s', (value) => {
    render(
      <ForecastCard
        day={{ ...day, precipitationProbabilityPercent: { available: true, value } }}
        unit="celsius"
      />,
    );
    expectMetric('Probabilidade de chuva', `${value} %`);
  });

  it('mantém a data e todos os marcadores quando o dia está indisponível', () => {
    const unavailable: ForecastDay = {
      date: day.date,
      minTemperatureC: { available: false },
      maxTemperatureC: { available: false },
      conditionLabel: { available: false },
      precipitationProbabilityPercent: { available: false },
      precipitationMm: { available: false },
      windKmh: { available: false },
    };
    render(<ForecastCard day={unavailable} unit="fahrenheit" />);
    expect(screen.getByRole('heading', { name: 'ter., 27/10/2026' })).toBeInTheDocument();
    expect(screen.getAllByText('Indisponível')).toHaveLength(6);
    expect(screen.queryByText('☀️')).not.toBeInTheDocument();
  });

  it('não infere probabilidade a partir de mm nem ícone de condição desconhecida', () => {
    render(
      <ForecastCard
        day={{
          ...day,
          conditionLabel: { available: true, value: 'Condição desconhecida' },
          precipitationProbabilityPercent: { available: false },
          precipitationMm: { available: true, value: 4.2 },
        }}
        unit="celsius"
      />,
    );
    expectMetric('Probabilidade de chuva', 'Indisponível');
    expectMetric('Precipitação', '4,2 mm');
    expect(screen.queryByText('☀️')).not.toBeInTheDocument();
  });

  it('aceita todos os dias do mock com probabilidade válida', () => {
    for (const forecastDay of mockWeatherData.forecast) {
      const field = forecastDay.precipitationProbabilityPercent;
      expect(field.available).toBe(true);
      if (field.available) {
        expect(field.value).toBeGreaterThanOrEqual(0);
        expect(field.value).toBeLessThanOrEqual(100);
      }
    }
  });
});

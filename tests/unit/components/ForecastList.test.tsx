import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ForecastList from '../../../src/components/ForecastList';
import { mockWeatherData } from '../../../src/mocks/weather';

afterEach(cleanup);

describe('ForecastList', () => {
  it('exibe exatamente cinco dias na ordem recebida no grid responsivo', () => {
    render(<ForecastList forecast={mockWeatherData.forecast} unit="celsius" />);

    expect(screen.getByRole('region', { name: 'Previsão diária' })).toBeInTheDocument();
    const list = screen.getByRole('list');
    expect(list).toHaveClass('grid', 'grid-cols-2', 'sm:grid-cols-3', 'lg:grid-cols-5');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(items.map((item) => item.querySelector('time')?.getAttribute('datetime'))).toEqual(
      mockWeatherData.forecast.map((day) => day.date),
    );
    const expected = [
      ['27,5 °C', '18,2 °C', '10 %', '0 mm', '15,3 km/h'],
      ['29,3 °C', '19,1 °C', '0 %', '0 mm', '11,8 km/h'],
      ['26,1 °C', '20,3 °C', '80 %', '4,2 mm', '18,4 km/h'],
      ['23,6 °C', '17,8 °C', '20 %', '0 mm', '14,7 km/h'],
      ['25,8 °C', '16,5 °C', '0 %', '0 mm', '10,2 km/h'],
    ];
    items.forEach((item, index) => {
      expect(
        within(item)
          .getAllByRole('definition')
          .map((field) => field.textContent),
      ).toEqual(expected[index]);
    });
  });

  it('propaga a unidade a todos os cards', () => {
    const { rerender } = render(
      <ForecastList forecast={mockWeatherData.forecast} unit="celsius" />,
    );
    expect(screen.getAllByText(/°C/)).toHaveLength(10);
    rerender(<ForecastList forecast={mockWeatherData.forecast} unit="fahrenheit" />);
    expect(screen.getAllByText(/°F/)).toHaveLength(10);
    expect(screen.queryByText(/°C/)).not.toBeInTheDocument();
  });

  it('informa lista vazia sem inventar dias', () => {
    render(<ForecastList forecast={[]} unit="celsius" />);
    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma previsão disponível.');
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});

import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weather';
import {
  getCurrentWeather,
  getForecast,
  searchCities,
  WeatherServiceError,
} from '../../src/services/weatherService';

vi.mock('../../src/services/weatherService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/services/weatherService')>();
  return { ...original, searchCities: vi.fn(), getCurrentWeather: vi.fn(), getForecast: vi.fn() };
});
const city = mockWeatherData.city;
const otherCity = { ...city, admin1: 'Outra região', latitude: 10 };
beforeEach(() => {
  vi.mocked(searchCities).mockResolvedValue([city, otherCity]);
  vi.mocked(getCurrentWeather).mockResolvedValue(mockWeatherData.current);
  vi.mocked(getForecast).mockResolvedValue(mockWeatherData.forecast);
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

async function selectCity(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Cidade'), 'Sal');
  await user.click(await screen.findByRole('option', { name: /Salvador.*Bahia/ }));
}

describe('App com API e estados independentes', () => {
  it('inicia idle e avisa sobre compartilhamento antes da busca', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Como está o clima?' })).toBeInTheDocument();
    expect(screen.getByRole('complementary')).toHaveTextContent('nome pesquisado é enviado');
    expect(searchCities).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Graus Celsius' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('autocomplete permite escolher o segundo homônimo sem consulta antes da seleção', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Cidade'), 'Sal');
    await screen.findByRole('option', { name: /Outra região/ });
    expect(getCurrentWeather).not.toHaveBeenCalled();
    expect(getForecast).not.toHaveBeenCalled();
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(await screen.findByRole('region', { name: 'Salvador' })).toHaveTextContent(
      'Outra região',
    );
    expect(getCurrentWeather).toHaveBeenCalledWith(otherCity, expect.any(AbortSignal));
    expect(getForecast).toHaveBeenCalledWith(otherCity, expect.any(AbortSignal));
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('envio do formulário só lista cidades, sem escolher a primeira', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Cidade'), 'Sal');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await screen.findByRole('option', { name: /Salvador.*Bahia/ });
    expect(getCurrentWeather).not.toHaveBeenCalled();
  });

  it('envio abaixo de três letras mostra validação sem chamar rede', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Cidade'), 'Sa');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Digite pelo menos 3 letras');
    expect(screen.getByLabelText('Cidade')).toHaveFocus();
    expect(searchCities).not.toHaveBeenCalled();
  });

  it('mostra loading e vazio da busca com foco ao editar', async () => {
    let resolve!: (value: []) => void;
    vi.mocked(searchCities).mockReturnValue(
      new Promise((res) => {
        resolve = res;
      }),
    );
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Cidade'), 'Sal');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByRole('status')).toHaveTextContent('Buscando cidades');
    resolve([]);
    await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada' });
    await user.click(screen.getByRole('button', { name: 'Editar busca' }));
    expect(screen.getByLabelText('Cidade')).toHaveFocus();
  });

  it('retry de busca recupera erro e preserva consulta', async () => {
    vi.mocked(searchCities).mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Cidade'), 'Sal');
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await screen.findByRole('region', { name: 'Resultado da busca' });
    expect(
      await screen.findByText(/localidades encontradas.*consultar o clima/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Cidade')).toHaveValue('Sal');
    expect(screen.getByRole('region', { name: 'Resultado da busca' })).toHaveFocus();
    expect(getForecast).not.toHaveBeenCalled();
  });

  it.each([
    'current',
    'forecast',
  ] as const)('retry de %s preserva a outra seção e unidade', async (operation) => {
    const service = operation === 'current' ? vi.mocked(getCurrentWeather) : vi.mocked(getForecast);
    service.mockRejectedValueOnce(new WeatherServiceError('Tempo limite', { kind: 'timeout' }));
    const user = userEvent.setup();
    render(<App />);
    await selectCity(user);
    const failedSection = screen.getByRole('region', {
      name: operation === 'current' ? 'Seção: Condições meteorológicas' : 'Seção: Previsão diária',
    });
    expect(await within(failedSection).findByRole('alert')).toHaveTextContent(
      'Tempo limite excedido',
    );
    expect(
      await screen.findByRole('region', {
        name: operation === 'current' ? 'Previsão diária' : 'Salvador',
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Graus Fahrenheit' }));
    await user.click(within(failedSection).getByRole('button', { name: 'Tentar novamente' }));
    await screen.findByRole('region', {
      name: operation === 'current' ? 'Salvador' : 'Previsão diária',
    });
    expect(failedSection).toHaveFocus();
    expect(within(screen.getByRole('main')).getAllByText(/°F/)).toHaveLength(11);
    expect(getCurrentWeather).toHaveBeenCalledTimes(operation === 'current' ? 2 : 1);
    expect(getForecast).toHaveBeenCalledTimes(operation === 'forecast' ? 2 : 1);
    expect(searchCities).toHaveBeenCalledTimes(1);
  });

  it('renderiza parcial e vazio meteorológico sem inventar valores', async () => {
    vi.mocked(getCurrentWeather).mockResolvedValue({
      ...mockWeatherData.current,
      humidityPercent: { available: false },
    });
    vi.mocked(getForecast).mockResolvedValue(
      mockWeatherData.forecast.map(({ date }) => ({
        date,
        minTemperatureC: { available: false },
        maxTemperatureC: { available: false },
        conditionLabel: { available: false },
        precipitationProbabilityPercent: { available: false },
        precipitationMm: { available: false },
        windKmh: { available: false },
      })),
    );
    const user = userEvent.setup();
    render(<App />);
    await selectCity(user);
    expect(
      await screen.findByText('Condições meteorológicas: dados parcialmente disponíveis.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Salvador' })).toHaveTextContent('Indisponível');
    expect(
      screen.getByRole('heading', { name: 'Dados indisponíveis: Previsão diária' }),
    ).toBeInTheDocument();
  });
});

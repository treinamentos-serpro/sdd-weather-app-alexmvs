import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchCities, WeatherServiceError } from '../../../src/services/weatherService';

const city = {
  name: 'São Paulo',
  admin1: 'São Paulo',
  country: 'Brasil',
  latitude: -23.5475,
  longitude: -46.6361,
  timezone: 'America/Sao_Paulo',
};

function mockResponse(body: unknown, status = 200) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('searchCities', () => {
  it.each(['', '   ', '\t\n'])('retorna lista vazia sem acessar a rede para %j', async (name) => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    await expect(searchCities(name)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('codifica o nome e mapeia somente os campos de City, preservando a grafia', async () => {
    const fetchMock = mockResponse({ results: [{ id: 3448439, ...city }] });

    await expect(searchCities('  São Paulo & região?  ')).resolves.toEqual([city]);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      'https://geocoding-api.open-meteo.com/v1/search?name=S%C3%A3o%20Paulo%20%26%20regi%C3%A3o%3F&count=100&language=pt&format=json',
    );
  });

  it('aceita cidades sem região, país ou fuso sem inventar valores', async () => {
    const minimalCity = { name: "D'Oeste", latitude: 0, longitude: 0 };
    mockResponse({ results: [minimalCity] });

    await expect(searchCities("D'Oeste")).resolves.toEqual([minimalCity]);
  });

  it.each([
    {},
    { results: [] },
  ])('retorna lista vazia para resposta sem resultados: %j', async (body) => {
    mockResponse(body);

    await expect(searchCities('Inexistente')).resolves.toEqual([]);
  });

  it('filtra candidatos inválidos antes de limitar a cinco, preservando a ordem', async () => {
    const cities = Array.from({ length: 6 }, (_, index) => ({ ...city, name: `Cidade ${index}` }));
    mockResponse({
      results: [
        null,
        { ...city, name: ' ' },
        { ...city, latitude: 91 },
        { ...city, longitude: -181 },
        { ...city, latitude: '0' },
        ...cities,
      ],
    });

    await expect(searchCities('Cidade')).resolves.toEqual(cities.slice(0, 5));
  });

  it.each([400, 429, 500])('lança WeatherServiceError para HTTP %i', async (status) => {
    mockResponse({}, status);

    await expect(searchCities('São Paulo')).rejects.toThrow(WeatherServiceError);
  });

  it.each([
    null,
    { error: true },
    { results: null },
    { results: [{}] },
  ])('não apresenta resposta inválida como lista vazia: %j', async (body) => {
    mockResponse(body);

    await expect(searchCities('São Paulo')).rejects.toThrow(WeatherServiceError);
  });

  it('propaga falhas de rede sem convertê-las em lista vazia', async () => {
    const error = new TypeError('Falha de rede');
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(error);

    await expect(searchCities('São Paulo')).rejects.toBe(error);
  });

  it('propaga JSON inválido sem convertê-lo em lista vazia', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{'));

    await expect(searchCities('São Paulo')).rejects.toThrow(SyntaxError);
  });
});

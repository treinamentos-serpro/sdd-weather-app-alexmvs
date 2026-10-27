import { describe, expect, it } from 'vitest';
import {
  filterValidCities,
  isValidCityName,
  isValidCoordinates,
} from '../../../src/lib/validation';

const city = { name: 'São Paulo', latitude: 0, longitude: 0 };

describe('isValidCityName', () => {
  it.each(
    ['', ' ', '\t\n', null, undefined, 0, {}, []].map((value) => [value]),
  )('rejeita %j', (name) => {
    expect(isValidCityName(name)).toBe(false);
  });
  it.each(['A', 'D’Oeste', ' São Paulo ', '東京'])('aceita nome não vazio %s', (name) => {
    expect(isValidCityName(name)).toBe(true);
  });
});

describe('isValidCoordinates', () => {
  it.each([
    [-90, -180],
    [90, 180],
    [-90, 180],
    [90, -180],
    [0, 0],
  ])('aceita limites inclusivos %s, %s', (latitude, longitude) => {
    expect(isValidCoordinates(latitude, longitude)).toBe(true);
  });
  it.each([
    [-90.000001, 0],
    [90.000001, 0],
    [0, -180.000001],
    [0, 180.000001],
    [NaN, 0],
    [0, NaN],
    [Infinity, 0],
    [-Infinity, 0],
    [0, Infinity],
    [0, -Infinity],
    ['0', 0],
    [0, '0'],
    [null, 0],
    [0, undefined],
  ])('rejeita %s, %s', (latitude, longitude) => {
    expect(isValidCoordinates(latitude, longitude)).toBe(false);
  });
});

describe('filterValidCities', () => {
  it('retorna os cinco primeiros válidos intercalados na ordem original, sem mutar entrada', () => {
    const valid = Array.from({ length: 6 }, (_, index) => ({ ...city, name: `Cidade ${index}` }));
    const values = Object.freeze(
      valid.flatMap((value) => [null, { ...city, latitude: NaN }, value]),
    );
    expect(filterValidCities(values)).toEqual(valid.slice(0, 5));
    expect(values).toHaveLength(18);
  });
  it('aceita menos de cinco e extrai apenas os campos opcionais textuais', () => {
    const value = {
      ...city,
      name: ' São Paulo ',
      admin1: 'SP',
      country: 'Brasil',
      timezone: 'UTC',
      id: 1,
    };
    expect(
      filterValidCities([{}, [], value, { ...city, country: null, admin1: 1, timezone: false }]),
    ).toEqual([
      { ...city, name: value.name, admin1: 'SP', country: 'Brasil', timezone: 'UTC' },
      city,
    ]);
    expect(value.id).toBe(1);
  });
  it('retorna vazio sem fabricar cidades quando todos são inválidos', () => {
    expect(
      filterValidCities([
        undefined,
        null,
        [],
        {},
        'Cidade',
        { ...city, name: ' ' },
        { ...city, longitude: Infinity },
      ]),
    ).toEqual([]);
    expect(filterValidCities([])).toEqual([]);
  });
});

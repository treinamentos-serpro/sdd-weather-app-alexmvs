import { describe, expect, expectTypeOf, it } from 'vitest';
import { mockWeatherData } from '../../src/mocks/weather';
import type { WeatherData, WeatherField } from '../../src/types/weather';

describe('mockWeatherData', () => {
  it('segue o contrato compartilhado e identifica a cidade e seu fuso', () => {
    expectTypeOf(mockWeatherData).toEqualTypeOf<WeatherData>();
    expect(mockWeatherData.city).toEqual({
      name: 'Salvador',
      admin1: 'Bahia',
      country: 'Brasil',
      latitude: -12.9714,
      longitude: -38.5014,
      timezone: 'America/Bahia',
    });
  });

  it('fornece todas as condições atuais, preservando zero como disponível', () => {
    const { updatedAt, ...fields } = mockWeatherData.current;

    expect(updatedAt).toBe('2026-10-27T15:00:00-03:00');
    for (const field of Object.values(fields)) {
      expect(field.available).toBe(true);
    }
    expect(mockWeatherData.current.temperatureC).toEqual({ available: true, value: 25.4 });
    expect(mockWeatherData.current.precipitationMm).toEqual({ available: true, value: 0 });
  });

  it('fornece cinco datas consecutivas a partir da data local da atualização', () => {
    expect(mockWeatherData.forecast.map((day) => day.date)).toEqual([
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
    ]);

    for (const { date, ...fields } of mockWeatherData.forecast) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const field of Object.values(fields)) {
        expect(field.available).toBe(true);
      }
      if (fields.minTemperatureC.available && fields.maxTemperatureC.available) {
        expect(fields.minTemperatureC.value).toBeLessThanOrEqual(fields.maxTemperatureC.value);
      }
    }
  });
});

describe('WeatherField', () => {
  it('distingue um valor disponível de um campo indisponível', () => {
    const fields: WeatherField<number>[] = [{ available: true, value: 0 }, { available: false }];

    for (const field of fields) {
      if (field.available) {
        expectTypeOf(field.value).toEqualTypeOf<number>();
        expect(field.value).toBe(0);
      } else {
        expectTypeOf(field).toEqualTypeOf<{ available: false }>();
        expect(field).not.toHaveProperty('value');
      }
    }
  });
});

import { describe, expect, it } from 'vitest';
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  formatTemperature,
} from '../../src/lib/temperature';

describe('temperature', () => {
  it('converte nas duas direções sem arredondar a origem', () => {
    expect(celsiusToFahrenheit(20)).toBe(68);
    expect(celsiusToFahrenheit(10)).toBe(50);
    expect(fahrenheitToCelsius(68)).toBe(20);
    expect(celsiusToFahrenheit(25.4)).toBeCloseTo(77.72);
  });

  it.each([
    [20, 'celsius', '20,0 °C'],
    [20, 'fahrenheit', '68,0 °F'],
    [10, 'fahrenheit', '50,0 °F'],
    [1.25, 'celsius', '1,3 °C'],
    [-1.25, 'celsius', '-1,3 °C'],
    [0, 'celsius', '0,0 °C'],
    [-40, 'fahrenheit', '-40,0 °F'],
  ] as const)('formata %s em %s como %s', (value, unit, expected) => {
    expect(formatTemperature(value, unit)).toBe(expected);
  });

  it.each([
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])('rejeita temperatura não finita (%s)', (value) => {
    expect(() => formatTemperature(value, 'celsius')).toThrow(RangeError);
  });
});

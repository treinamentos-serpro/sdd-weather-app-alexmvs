import { describe, expect, it } from 'vitest';
import { getWeatherIcon, getWeatherLabel } from '../../src/lib/weatherCodes';

describe('getWeatherLabel', () => {
  it.each([
    [0, 'Céu limpo'],
    [1, 'Predominantemente limpo'],
    [2, 'Parcialmente nublado'],
    [3, 'Encoberto'],
    [45, 'Nevoeiro'],
    [48, 'Nevoeiro com geada'],
    [51, 'Garoa leve'],
    [53, 'Garoa moderada'],
    [55, 'Garoa intensa'],
    [56, 'Garoa congelante leve'],
    [57, 'Garoa congelante intensa'],
    [61, 'Chuva leve'],
    [63, 'Chuva moderada'],
    [65, 'Chuva forte'],
    [66, 'Chuva congelante leve'],
    [67, 'Chuva congelante forte'],
    [71, 'Neve leve'],
    [73, 'Neve moderada'],
    [75, 'Neve forte'],
    [77, 'Grãos de neve'],
    [80, 'Pancadas de chuva leves'],
    [81, 'Pancadas de chuva moderadas'],
    [82, 'Pancadas de chuva violentas'],
    [85, 'Pancadas de neve leves'],
    [86, 'Pancadas de neve fortes'],
    [95, 'Trovoada'],
    [96, 'Trovoada com granizo leve'],
    [97, 'Trovoada forte'],
    [99, 'Trovoada com granizo forte'],
  ])('mapeia o código WMO %s para %s', (code, label) => {
    expect(getWeatherLabel(code)).toBe(label);
  });

  it.each([
    undefined,
    null,
    '0',
    999,
    1.5,
    NaN,
    Infinity,
  ])('não infere condição para código inválido: %j', (code) => {
    expect(getWeatherLabel(code)).toBeNull();
  });
});

describe('getWeatherIcon', () => {
  it('retorna ícones distintos para condições conhecidas', () => {
    expect(getWeatherIcon('Céu limpo')).toBe('☀️');
    expect(getWeatherIcon('Parcialmente nublado')).toBe('⛅');
    expect(getWeatherIcon('Chuva leve')).toBe('🌧️');
  });

  it.each([
    '',
    'Condição desconhecida',
    'Sol inventado',
  ])('não infere ícone para o rótulo %j', (label) => {
    expect(getWeatherIcon(label)).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { getWeatherIcon } from '../../src/lib/weatherCodes';

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

import { describe, expect, it, vi } from 'vitest';
import { getForecastDates } from '../../../src/lib/dates';

describe('getForecastDates', () => {
  it('produz dias locais distintos em dois fusos para o mesmo instante', () => {
    const now = new Date('2026-10-28T01:00:00Z');
    expect(getForecastDates('America/Sao_Paulo', now)).toEqual([
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
    ]);
    expect(getForecastDates('Asia/Tokyo', now)).toEqual([
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ]);
    expect(now.toISOString()).toBe('2026-10-28T01:00:00.000Z');
  });
  it.each([
    [
      'Pacific/Kiritimati',
      '2026-12-31T12:00:00Z',
      ['2027-01-01', '2027-01-02', '2027-01-03', '2027-01-04', '2027-01-05'],
    ],
    [
      'UTC',
      '2024-02-28T12:00:00Z',
      ['2024-02-28', '2024-02-29', '2024-03-01', '2024-03-02', '2024-03-03'],
    ],
    [
      'UTC',
      '2026-02-28T12:00:00Z',
      ['2026-02-28', '2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04'],
    ],
    [
      'America/New_York',
      '2026-03-07T12:00:00Z',
      ['2026-03-07', '2026-03-08', '2026-03-09', '2026-03-10', '2026-03-11'],
    ],
    [
      'America/New_York',
      '2026-10-31T12:00:00Z',
      ['2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04'],
    ],
  ])('atravessa mês/ano e horário de verão: %s %s', (zone, instant, dates) => {
    expect(getForecastDates(zone, new Date(instant))).toEqual(dates);
  });
  it('respeita o instante antes e depois da meia-noite local', () => {
    expect(getForecastDates('America/Sao_Paulo', new Date('2026-10-28T02:59:59.999Z'))?.[0]).toBe(
      '2026-10-27',
    );
    expect(getForecastDates('America/Sao_Paulo', new Date('2026-10-28T03:00:00Z'))?.[0]).toBe(
      '2026-10-28',
    );
  });
  it.each(
    [undefined, null, '', ' ', 'Invalid/Zone', '+03:00', '-03:00', 0, {}, []].map((value) => [
      value,
    ]),
  )('rejeita fuso %j sem fallback', (zone) => {
    expect(getForecastDates(zone, new Date('2026-10-27T18:00:00Z'))).toBeNull();
  });
  it.each([
    new Date(NaN),
    new Date('9999-12-31T00:00:00Z'),
    new Date(-8640000000000000),
    new Date(8640000000000000),
  ])('retorna null para instante inválido ou calendário fora de YYYY-MM-DD: %s', (now) => {
    expect(getForecastDates('UTC', now)).toBeNull();
  });
  it('não consulta o relógio global', () => {
    const spy = vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('Relógio global');
    });
    try {
      expect(getForecastDates('UTC', new Date('2026-01-01T00:00:00Z'))?.[0]).toBe('2026-01-01');
    } finally {
      spy.mockRestore();
    }
  });
});

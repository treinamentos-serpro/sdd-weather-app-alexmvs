import { describe, expect, it } from 'vitest';
import { formatDayLabel, formatMetric } from '../../src/lib/format';

describe('formatDayLabel', () => {
  it.each([
    ['2026-10-27', 'ter., 27/10/2026'],
    ['2026-12-31', 'qui., 31/12/2026'],
    ['2027-01-01', 'sex., 01/01/2027'],
    ['2028-02-29', 'ter., 29/02/2028'],
  ])('preserva a data local %s', (date, label) => {
    expect(formatDayLabel(date)).toBe(label);
  });

  it.each([
    '',
    '2026-02-29',
    '2026-04-31',
    '2026-13-01',
    '27/10/2026',
    '2026-10-27T00:00:00Z',
  ])('rejeita data inválida (%s)', (date) => {
    expect(() => formatDayLabel(date)).toThrow(RangeError);
  });
});

describe('formatMetric', () => {
  it('distingue zero de indisponibilidade', () => {
    expect(formatMetric({ available: true, value: 0 }, '%')).toBe('0 %');
    expect(formatMetric({ available: false }, '%')).toBe('Indisponível');
  });
});

/** Cinco datas do calendário local; o instante é sempre fornecido pelo chamador. */
export function getForecastDates(timezone: unknown, now: Date): string[] | null {
  if (
    typeof timezone !== 'string' ||
    !timezone.trim() ||
    /^[+-]/.test(timezone) ||
    !Number.isFinite(now.getTime())
  ) {
    return null;
  }
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      calendar: 'gregory',
      numberingSystem: 'latn',
      era: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const part = (type: string) => parts.find((value) => value.type === type)?.value;
    if (part('era') !== 'AD') return null;
    const year = part('year')?.padStart(4, '0');
    const firstDay = new Date(`${year}-${part('month')}-${part('day')}T00:00:00Z`);
    const dates = Array.from({ length: 5 }, (_, index) =>
      new Date(firstDay.getTime() + index * 86400000).toISOString().slice(0, 10),
    );
    return dates.every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)) ? dates : null;
  } catch (error) {
    if (error instanceof RangeError) return null;
    throw error;
  }
}

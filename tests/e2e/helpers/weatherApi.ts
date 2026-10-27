import type { Page } from '@playwright/test';

export const city = {
  name: 'Salvador',
  admin1: 'Bahia',
  country: 'Brasil',
  latitude: -12.9714,
  longitude: -38.5014,
  timezone: 'America/Bahia',
};

export const forecastResponse = {
  timezone: 'America/Bahia',
  utc_offset_seconds: -10800,
  current_units: {
    temperature_2m: '°C',
    relative_humidity_2m: '%',
    wind_speed_10m: 'km/h',
    surface_pressure: 'hPa',
    precipitation: 'mm',
  },
  current: {
    time: '2026-10-27T15:00',
    temperature_2m: 25.4,
    relative_humidity_2m: 60,
    weather_code: 2,
    wind_speed_10m: 10,
    surface_pressure: 1014,
    precipitation: 0,
  },
  daily_units: {
    temperature_2m_min: '°C',
    temperature_2m_max: '°C',
    precipitation_probability_max: '%',
    precipitation_sum: 'mm',
    wind_speed_10m_max: 'km/h',
  },
  daily: {
    time: ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'],
    temperature_2m_min: [20, 21, 22, 23, 24],
    temperature_2m_max: [27, 28, 29, 30, 31],
    weather_code: [0, 1, 2, 3, 61],
    precipitation_probability_max: [0, 10, 20, 30, 40],
    precipitation_sum: [0, 0, 0, 1, 2],
    wind_speed_10m_max: [10, 11, 12, 13, 14],
  },
};

export async function mockWeatherApi(page: Page) {
  const calls = { search: 0, current: 0, forecast: 0 };
  await page.clock.install({ time: new Date('2026-10-27T18:00:00Z') });
  await page.route('https://geocoding-api.open-meteo.com/v1/search?**', async (route) => {
    calls.search++;
    await route.fulfill({
      json: { results: [city, { ...city, admin1: 'Outra região', latitude: 10 }] },
    });
  });
  await page.route('https://api.open-meteo.com/v1/forecast?**', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.has('current')) calls.current++;
    if (url.searchParams.has('daily')) calls.forecast++;
    await route.fulfill({
      json: {
        ...forecastResponse,
        current: {
          ...forecastResponse.current,
          temperature_2m: url.searchParams.get('latitude') === '10' ? 12.4 : 25.4,
        },
      },
    });
  });
  return calls;
}

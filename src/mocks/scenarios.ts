import type { City, CurrentWeather, ForecastDay, SectionState } from '../types/weather';
import { findMockData } from './catalog';

export type MockSearchScenario = 'normal' | 'loading' | 'empty' | 'invalid' | 'error' | 'timeout';
export type MockSectionScenario = 'success' | 'loading' | 'empty' | 'partial' | 'error' | 'timeout';

function section<T>(data: T, scenario: MockSectionScenario): SectionState<T> {
  if (scenario === 'error' || scenario === 'timeout') {
    return {
      status: scenario,
      data: null,
      error: {
        kind: scenario === 'timeout' ? 'timeout' : 'network',
        message:
          scenario === 'timeout' ? 'Tempo limite simulado excedido.' : 'Falha simulada de rede.',
      },
    };
  }
  return {
    status: scenario,
    data: scenario === 'loading' || scenario === 'empty' ? null : data,
    error: null,
  };
}

export function mockCurrentSection(
  city: City,
  scenario: MockSectionScenario,
): SectionState<CurrentWeather> {
  const data = findMockData(city).current;
  return section(
    scenario === 'partial' ? { ...data, humidityPercent: { available: false } } : data,
    scenario,
  );
}

export function mockForecastSection(
  city: City,
  scenario: MockSectionScenario,
): SectionState<ForecastDay[]> {
  const data = findMockData(city).forecast;
  return section(
    scenario === 'partial'
      ? data.map((day, index) =>
          index === 1
            ? {
                date: day.date,
                minTemperatureC: { available: false },
                maxTemperatureC: { available: false },
                conditionLabel: { available: false },
                precipitationProbabilityPercent: { available: false },
                precipitationMm: { available: false },
                windKmh: { available: false },
              }
            : day,
        )
      : data,
    scenario,
  );
}

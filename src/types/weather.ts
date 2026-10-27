export type Unit = 'celsius' | 'fahrenheit';

export type WeatherOperation = 'search' | 'current' | 'forecast';

export interface City {
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export type WeatherField<T> = { available: true; value: T } | { available: false };

export interface CurrentWeather {
  temperatureC: WeatherField<number>;
  conditionLabel: WeatherField<string>;
  humidityPercent: WeatherField<number>;
  windKmh: WeatherField<number>;
  pressureHpa: WeatherField<number>;
  precipitationMm: WeatherField<number>;
  updatedAt: string | null;
}

export interface ForecastDay {
  /** Data YYYY-MM-DD no calendário local da cidade. */
  date: string;
  minTemperatureC: WeatherField<number>;
  maxTemperatureC: WeatherField<number>;
  conditionLabel: WeatherField<string>;
  precipitationProbabilityPercent: WeatherField<number>;
  precipitationMm: WeatherField<number>;
  windKmh: WeatherField<number>;
}

export interface WeatherData {
  city: City;
  current: CurrentWeather;
  forecast: ForecastDay[];
}

export type OperationStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'partial'
  | 'empty'
  | 'error'
  | 'timeout';

export interface SectionState<T> {
  status: OperationStatus;
  data: T | null;
  error: WeatherError | null;
}

export type WeatherError =
  | { kind: 'network'; message: string }
  | { kind: 'http'; message: string }
  | { kind: 'invalid-response'; message: string }
  | { kind: 'timeout'; message: string };

export interface WeatherState {
  query: string;
  suggestions: City[];
  searchStatus: OperationStatus;
  searchError: WeatherError | null;
  selectedCity: City | null;
  current: SectionState<CurrentWeather>;
  forecast: SectionState<ForecastDay[]>;
  unit: Unit;
}

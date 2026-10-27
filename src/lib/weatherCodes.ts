const conditionIcons = new Map<string, string>([
  ['Céu limpo', '☀️'],
  ['Predominantemente limpo', '🌤️'],
  ['Parcialmente nublado', '⛅'],
  ['Encoberto', '☁️'],
  ['Nevoeiro', '🌫️'],
  ['Chuva leve', '🌧️'],
  ['Chuva moderada', '🌧️'],
  ['Chuva forte', '🌧️'],
  ['Neve leve', '🌨️'],
  ['Neve moderada', '🌨️'],
  ['Neve forte', '🌨️'],
  ['Trovoada', '⛈️'],
]);

/** Ícone decorativo de um rótulo já validado; não interpreta códigos WMO. */
export function getWeatherIcon(conditionLabel: string): string | null {
  return conditionIcons.get(conditionLabel) ?? null;
}

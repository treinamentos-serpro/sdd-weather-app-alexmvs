import {
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
  useId,
  useRef,
  useState,
} from 'react';
import type { City } from '../types/weather';

export interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
  query?: string;
  onQueryChange?: (query: string) => void;
  suggestions?: City[];
  onSelect?: (city: City) => void;
}

interface ActiveOption {
  key: string;
  query: string;
  suggestionsKey: string;
}

function cityKey(city: City): string {
  return JSON.stringify([city.latitude, city.longitude, city.name]);
}

function getOptionKeys(cities: City[]): string[] {
  const occurrences = new Map<string, number>();

  return cities.map((city) => {
    const key = cityKey(city);
    const occurrence = occurrences.get(key) ?? 0;
    occurrences.set(key, occurrence + 1);
    return `${key}:${occurrence}`;
  });
}

export default function SearchBar({
  onSearch,
  disabled = false,
  query,
  onQueryChange,
  suggestions = [],
  onSelect,
}: SearchBarProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const listboxId = `${inputId}-suggestions`;
  const instructionsId = `${inputId}-instructions`;
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [isListOpen, setIsListOpen] = useState(false);
  const [activeOption, setActiveOption] = useState<ActiveOption | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = query !== undefined;
  const currentQuery = isControlled ? query : city;
  const optionKeys = getOptionKeys(suggestions);
  const suggestionsKey = JSON.stringify(optionKeys);
  const activeIndex =
    activeOption?.query === currentQuery && activeOption.suggestionsKey === suggestionsKey
      ? optionKeys.indexOf(activeOption.key)
      : -1;
  const isListVisible = isControlled && isListOpen && suggestions.length > 0 && !disabled;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;

    const trimmedCity = currentQuery.trim();
    if (!trimmedCity) {
      setError('Digite o nome de uma cidade.');
      inputRef.current?.focus();
      return;
    }
    if (trimmedCity.replace(/\s/g, '').length < 3) {
      setError('Digite pelo menos 3 letras para buscar cidades.');
      inputRef.current?.focus();
      return;
    }

    setError('');
    onSearch(trimmedCity);
  }

  function handleSelect(selectedCity: City) {
    if (disabled) return;
    setActiveOption(null);
    setIsListOpen(false);
    onSelect?.(selectedCity);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isControlled || disabled) return;

    if (event.key === 'Escape') {
      // Evita que o input type=search limpe a consulta enquanto a lista está aberta.
      if (isListVisible) event.preventDefault();
      setIsListOpen(false);
      setActiveOption(null);
      return;
    }

    if (suggestions.length === 0) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const nextIndex =
        event.key === 'ArrowDown'
          ? (activeIndex + 1) % suggestions.length
          : (activeIndex <= 0 ? suggestions.length : activeIndex) - 1;
      const nextKey = optionKeys[nextIndex];
      if (nextKey !== undefined) {
        setIsListOpen(true);
        setActiveOption({ key: nextKey, query: currentQuery, suggestionsKey });
      }
      return;
    }

    if (event.key === 'Enter' && isListVisible && activeIndex >= 0) {
      event.preventDefault();
      const selectedCity = suggestions[activeIndex];
      if (selectedCity) handleSelect(selectedCity);
    }
  }

  function handleBlur(event: FocusEvent<HTMLFormElement>) {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))
      return;
    setIsListOpen(false);
    setActiveOption(null);
  }

  return (
    <form
      role="search"
      aria-label="Buscar cidade"
      onSubmit={handleSubmit}
      onBlur={handleBlur}
      className="relative z-20 min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 font-sans text-white shadow-glass backdrop-blur-md"
    >
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium">
        Cidade
      </label>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          name="city"
          role={isControlled ? 'combobox' : undefined}
          value={currentQuery}
          disabled={disabled}
          aria-autocomplete={isControlled ? 'list' : undefined}
          aria-controls={isListVisible ? listboxId : undefined}
          {...(isControlled ? { 'aria-expanded': isListVisible } : {})}
          aria-activedescendant={
            isListVisible && activeIndex >= 0 ? `${inputId}-option-${activeIndex}` : undefined
          }
          aria-invalid={Boolean(error)}
          aria-describedby={
            [error ? errorId : null, isControlled ? instructionsId : null]
              .filter(Boolean)
              .join(' ') || undefined
          }
          placeholder="Ex.: Salvador"
          onFocus={() => {
            if (isControlled) setIsListOpen(true);
          }}
          onChange={(event) => {
            const nextQuery = event.target.value;
            if (isControlled) {
              onQueryChange?.(nextQuery);
              setActiveOption(null);
              setIsListOpen(true);
            } else {
              setCity(nextQuery);
            }
            setError('');
          }}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 rounded-xl border border-slate-500 bg-night-900 px-4 py-3 text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-xl bg-accent-500 px-5 py-3 font-semibold text-night-900 hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buscar
        </button>
      </div>
      {isControlled && (
        <p id={instructionsId} className="sr-only">
          Use as setas para navegar pelas sugestões, Enter para selecionar a opção ativa e Escape
          para fechar a lista.
        </p>
      )}
      {isListVisible && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Sugestões de cidades"
          className="absolute inset-x-0 top-full z-20 mt-2 max-h-60 min-w-0 overflow-y-auto rounded-xl border border-slate-500 bg-night-800 p-1 shadow-glass"
        >
          {suggestions.map((suggestion, index) => {
            return (
              <div key={optionKeys[index]} className="min-w-0">
                <button
                  id={`${inputId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-label={[suggestion.name, suggestion.admin1, suggestion.country]
                    .filter(Boolean)
                    .join(String.fromCharCode(44, 32))}
                  aria-selected={index === activeIndex}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(suggestion)}
                  className="block w-full min-w-0 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400 aria-selected:bg-white/10"
                >
                  <span className="block break-words font-medium">{suggestion.name}</span>
                  {(suggestion.admin1 || suggestion.country) && (
                    <span className="block break-words text-slate-300">
                      {[suggestion.admin1, suggestion.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </form>
  );
}

import { type ReactNode, useRef } from 'react';
import { operationLabels } from '../lib/operations';
import type { SectionState, WeatherOperation } from '../types/weather';
import EmptyState from './states/EmptyState';
import ErrorState from './states/ErrorState';
import LoadingState from './states/LoadingState';

export interface WeatherSectionProps {
  operation: Exclude<WeatherOperation, 'search'>;
  state: SectionState<unknown>;
  onRetry: () => void;
  onEdit: () => void;
  children?: ReactNode;
}

export default function WeatherSection({
  operation,
  state,
  onRetry,
  onEdit,
  children,
}: WeatherSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const label = operationLabels[operation];
  function retry() {
    ref.current?.focus();
    onRetry();
  }

  return (
    <section
      ref={ref}
      aria-label={`Seção: ${label}`}
      tabIndex={-1}
      className="min-h-40 min-w-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-400"
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {state.status === 'success' ? `${label}: dados disponíveis.` : ''}
        {state.status === 'partial' ? `${label}: dados parcialmente disponíveis.` : ''}
        {state.status === 'empty' ? `${label}: dados indisponíveis.` : ''}
      </p>
      {state.status === 'loading' && <LoadingState message={`Carregando: ${label}...`} />}
      {(state.status === 'error' || state.status === 'timeout') && (
        <ErrorState
          operation={operation}
          status={state.status}
          message={state.error?.message}
          onRetry={retry}
        />
      )}
      {state.status === 'empty' && (
        <EmptyState
          title={`Dados indisponíveis: ${label}`}
          hint="Não há dados meteorológicos para esta seção."
          onEdit={onEdit}
          onRetry={retry}
        />
      )}
      {(state.status === 'success' || state.status === 'partial') && children}
    </section>
  );
}

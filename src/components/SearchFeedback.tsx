import { useRef } from 'react';
import type { OperationStatus } from '../types/weather';
import EmptyState from './states/EmptyState';
import ErrorState from './states/ErrorState';
import LoadingState from './states/LoadingState';

export interface SearchFeedbackProps {
  status: OperationStatus;
  invalid: boolean;
  count: number;
  onEdit: () => void;
  onRetry: () => void;
  message?: string;
}

export default function SearchFeedback({
  status,
  invalid,
  count,
  onEdit,
  onRetry,
  message,
}: SearchFeedbackProps) {
  const ref = useRef<HTMLElement>(null);
  function retry() {
    ref.current?.focus();
    onRetry();
  }
  return (
    <section
      ref={ref}
      aria-label="Resultado da busca"
      tabIndex={-1}
      className="min-h-40 min-w-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-400"
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {status === 'success' ? `${count} localidades encontradas. Selecione uma sugestão.` : ''}
        {status === 'empty'
          ? invalid
            ? 'Não foi possível identificar a cidade.'
            : 'Nenhuma cidade encontrada.'
          : ''}
      </p>
      {status === 'idle' && (
        <EmptyState
          title="Como está o clima?"
          hint="Digite pelo menos 3 letras e selecione uma cidade nas sugestões."
          onEdit={onEdit}
        />
      )}
      {status === 'loading' && <LoadingState message="Buscando cidades..." />}
      {status === 'success' && (
        <p>{count} localidades encontradas. Selecione uma sugestão para consultar o clima.</p>
      )}
      {status === 'empty' && (
        <EmptyState
          title={invalid ? 'Não foi possível identificar a cidade' : 'Nenhuma cidade encontrada'}
          hint={
            invalid
              ? 'Não foi possível identificar os candidatos retornados. Edite ou repita a busca.'
              : 'Confira o nome ou tente outra cidade.'
          }
          onEdit={onEdit}
          onRetry={retry}
        />
      )}
      {(status === 'error' || status === 'timeout') && (
        <ErrorState operation="search" status={status} message={message} onRetry={retry} />
      )}
    </section>
  );
}

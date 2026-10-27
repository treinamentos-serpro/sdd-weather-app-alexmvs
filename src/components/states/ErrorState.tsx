import { operationLabels } from '../../lib/operations';
import type { WeatherOperation } from '../../types/weather';

export interface ErrorStateProps {
  message?: string;
  operation?: WeatherOperation;
  status?: 'error' | 'timeout';
  onRetry: () => void;
}

export default function ErrorState({
  message,
  operation = 'current',
  status = 'error',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="min-h-40 min-w-0 w-full rounded-2xl border border-white/10 bg-white/5 p-6 font-sans text-white shadow-glass backdrop-blur-md [overflow-wrap:anywhere]">
      <p role="alert" className="text-red-300">
        {status === 'timeout' ? 'Tempo limite excedido' : 'Falha'}: {operationLabels[operation]}.
        {message && <> {message}</>}
      </p>
      <button
        type="button"
        onClick={() => onRetry()}
        className="mt-4 min-h-11 rounded-xl bg-accent-500 px-5 py-3 font-semibold text-night-900 hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
      >
        Tentar novamente
      </button>
    </div>
  );
}

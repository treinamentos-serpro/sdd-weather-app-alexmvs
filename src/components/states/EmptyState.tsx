import { useId } from 'react';

export interface EmptyStateProps {
  title: string;
  hint: string;
  onEdit?: () => void;
  onRetry?: () => void;
}

export default function EmptyState({ title, hint, onEdit, onRetry }: EmptyStateProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="min-h-40 min-w-0 w-full rounded-2xl border border-white/10 bg-white/5 p-6 font-sans text-white shadow-glass backdrop-blur-md [overflow-wrap:anywhere]"
    >
      <h2 id={headingId} className="text-xl font-semibold">
        {title}
      </h2>
      <p className="mt-2 text-slate-300">{hint}</p>
      {(onEdit || onRetry) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit()}
              className="min-h-11 rounded-xl bg-accent-500 px-4 py-2 font-semibold text-night-900 hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
            >
              Editar busca
            </button>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={() => onRetry()}
              className="min-h-11 rounded-xl border border-slate-500 px-4 py-2 font-semibold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}
    </section>
  );
}

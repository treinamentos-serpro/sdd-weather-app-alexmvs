export interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Carregando dados...' }: LoadingStateProps) {
  return (
    <div
      role="status"
      className="flex min-h-40 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 font-sans text-white shadow-glass backdrop-blur-md"
    >
      <span
        aria-hidden="true"
        className="h-6 w-6 shrink-0 rounded-full border-2 border-white/20 border-t-accent-400 motion-safe:animate-spin"
      />
      <p className="min-w-0 [overflow-wrap:anywhere]">{message}</p>
    </div>
  );
}

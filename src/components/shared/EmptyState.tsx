interface EmptyStateProps {
  title: string
  message: string
}

export default function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="card p-6 text-center">
      <p className="hero-serif text-2xl text-[var(--ink)]">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--ink-2)]">{message}</p>
    </div>
  )
}

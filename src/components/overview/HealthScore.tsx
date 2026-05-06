interface HealthScoreProps {
  score: number
}

function labelFor(score: number): string {
  if (score >= 80) return 'Looking good'
  if (score >= 60) return 'A few things to check'
  if (score >= 40) return 'Worth a closer look'
  return 'Needs attention'
}

export default function HealthScore({ score }: HealthScoreProps) {
  const tone = score >= 80 ? 'var(--ok)' : score >= 60 ? 'var(--info)' : score >= 40 ? 'var(--warning)' : 'var(--critical)'

  return (
    <article className="card p-5" aria-label="Budget health score">
      <p className="text-sm text-[var(--ink-3)]">Budget health score</p>
      <p className="mt-2 hero-serif text-4xl" style={{ color: tone }}>
        {Math.round(score)}
      </p>
      <p className="mt-1 text-sm text-[var(--ink-2)]">{labelFor(score)}</p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, score))}%`, background: tone }} />
      </div>
    </article>
  )
}

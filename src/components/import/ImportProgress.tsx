import Skeleton from '@/components/shared/Skeleton'

interface ImportProgressProps {
  label: string
}

export default function ImportProgress({ label }: ImportProgressProps) {
  return (
    <div className="soft-card space-y-3 p-5" data-testid="import-progress" aria-live="polite">
      <p className="text-sm text-[var(--ink-2)]">{label}</p>
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-2 w-3/4 rounded-full" />
    </div>
  )
}

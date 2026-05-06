import clsx from 'clsx'
import type { Anomaly } from '@/lib/types'

interface SeverityBadgeProps {
  severity: Anomaly['severity']
}

const styles: Record<Anomaly['severity'], string> = {
  critical: 'text-[var(--critical)] bg-[var(--critical-bg)] border-[var(--critical)]/20',
  warning: 'text-[var(--warning)] bg-[var(--warning-bg)] border-[var(--warning)]/20',
  info: 'text-[var(--info)] bg-[var(--info-bg)] border-[var(--info)]/20',
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span className={clsx('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize', styles[severity])}>
      {severity}
    </span>
  )
}

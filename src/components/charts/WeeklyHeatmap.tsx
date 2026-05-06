import { mean } from '@/lib/statistics'
import type { Transaction } from '@/lib/types'

interface WeeklyHeatmapProps {
  transactions: Transaction[]
}

interface DayCell {
  key: string
  label: string
  total: number
}

function colorFor(value: number, avg: number): string {
  if (value === 0) return '#F5F4F0'
  if (value > avg * 2.2) return '#DC2626'
  if (value > avg * 1.4) return '#D97706'
  if (value > avg) return '#2563EB'
  return '#059669'
}

export default function WeeklyHeatmap({ transactions }: WeeklyHeatmapProps) {
  const debits = transactions.filter((txn) => txn.type === 'debit')

  const byDay = new Map<string, number>()
  debits.forEach((txn) => {
    const key = txn.date.toISOString().slice(0, 10)
    byDay.set(key, (byDay.get(key) ?? 0) + txn.amount)
  })

  const days: DayCell[] = [...byDay.entries()]
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .slice(-56)
    .map(([key, total]) => ({
      key,
      total,
      label: new Date(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }))

  const avg = mean(days.map((day) => day.total))

  return (
    <div className="card p-4">
      <p className="mb-3 text-sm text-[var(--ink-3)]">Weekly spending rhythm</p>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div
            key={day.key}
            className="rounded-md p-2 text-[10px] text-white"
            style={{ backgroundColor: colorFor(day.total, avg) }}
            title={`${day.label}: $${day.total.toFixed(2)}`}
          >
            <div>{day.label.split(' ')[1]}</div>
            <div className="mono">${Math.round(day.total)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Button from '@/components/shared/Button'

interface MonthlySummaryProps {
  onGenerate: () => Promise<string>
  disabled: boolean
}

export default function MonthlySummary({ onGenerate, disabled }: MonthlySummaryProps) {
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    try {
      const text = await onGenerate()
      setSummary(text)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card space-y-3 p-4">
      <h3 className="text-xl font-semibold">Generate my money story</h3>
      <p className="text-sm text-[var(--ink-2)]">
        Get a simple monthly narrative: what was normal, what changed, and what stood out.
      </p>
      <Button variant="secondary" onClick={() => void run()} loading={loading} disabled={disabled}>
        Generate summary
      </Button>
      {summary ? <div className="space-y-3 rounded-lg bg-[var(--surface-2)] p-4 text-sm leading-6 text-[var(--ink-2)]">{summary.split('\n').map((line, index) => <p key={index}>{line}</p>)}</div> : null}
    </section>
  )
}

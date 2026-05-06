'use client'

import { useState } from 'react'
import Button from '@/components/shared/Button'

interface WhatIfSimulatorProps {
  onAsk: (question: string) => Promise<string>
  disabled: boolean
}

export default function WhatIfSimulator({ onAsk, disabled }: WhatIfSimulatorProps) {
  const [question, setQuestion] = useState('What if I cut my restaurant spending in half?')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async () => {
    if (!question.trim()) return
    setLoading(true)
    try {
      const response = await onAsk(question)
      setAnswer(response)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card space-y-3 p-4">
      <h3 className="text-xl font-semibold">What-if savings simulator</h3>
      <p className="text-sm text-[var(--ink-2)]">Ask plain English questions and get real dollar impact.</p>
      <input
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        className="w-full rounded-lg border border-[var(--border)] px-3 py-2"
        aria-label="What if question"
      />
      <Button onClick={() => void run()} loading={loading} disabled={disabled}>
        Run simulation
      </Button>
      {answer ? <p className="rounded-lg bg-[var(--surface-2)] p-3 text-sm text-[var(--ink-2)]">{answer}</p> : null}
      {disabled ? (
        <p className="text-xs text-[var(--ink-3)]">AI tools are off until a Gemini API key is set.</p>
      ) : null}
    </section>
  )
}

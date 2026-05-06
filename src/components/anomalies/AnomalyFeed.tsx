'use client'

import { useState } from 'react'
import AnomalyCard from './AnomalyCard'
import AnomalyFilters from './AnomalyFilters'
import EmptyState from '@/components/shared/EmptyState'
import type { Anomaly } from '@/lib/types'
import type { SeverityFilter } from '@/hooks/useAnomalies'

interface AnomalyFeedProps {
  anomalies: Anomaly[]
  filter: SeverityFilter
  onFilterChange: (filter: SeverityFilter) => void
  onDismiss: (id: string) => void
  onUndismiss: (id: string) => void
  onAIExplain: (anomaly: Anomaly) => Promise<void>
  canAIExplain: boolean
  aiBusy: boolean
}

export default function AnomalyFeed({
  anomalies,
  filter,
  onFilterChange,
  onDismiss,
  onUndismiss,
  onAIExplain,
  canAIExplain,
  aiBusy,
}: AnomalyFeedProps) {
  const [activeAIId, setActiveAIId] = useState<string | null>(null)
  const [aiError, setAIError] = useState<string | null>(null)

  const handleAI = async (anomaly: Anomaly) => {
    if (aiBusy) return
    setActiveAIId(anomaly.id)
    setAIError(null)
    try {
      await onAIExplain(anomaly)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI request failed'
      setAIError(message)
    } finally {
      setActiveAIId(null)
    }
  }

  return (
    <section data-testid="anomaly-feed" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Anomaly Feed</h2>
          <p className="section-subtitle">What changed, what looks off, and what to do next.</p>
        </div>
        <AnomalyFilters value={filter} onChange={onFilterChange} />
      </div>

      {anomalies.length === 0 ? (
        <EmptyState
          title="No weird transactions"
          message="Your finances look pretty normal right now. Keep doing what you're doing."
        />
      ) : (
        <div className="space-y-3">
          {aiError ? (
            <div className="card border-[var(--warning)]/30 bg-[var(--warning-bg)] p-3 text-sm text-[var(--warning)]">
              {aiError}
            </div>
          ) : null}
          {anomalies.map((anomaly) => (
            <AnomalyCard
              key={anomaly.id}
              anomaly={anomaly}
              onDismiss={onDismiss}
              onUndismiss={onUndismiss}
              onAIExplain={handleAI}
              aiLoading={activeAIId === anomaly.id}
              canAIExplain={canAIExplain}
              aiBusy={aiBusy}
            />
          ))}
        </div>
      )}
    </section>
  )
}

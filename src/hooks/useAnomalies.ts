'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Anomaly } from '@/lib/types'

export type SeverityFilter = 'all' | 'critical' | 'warning' | 'info'

export function useAnomalies(initial: Anomaly[]) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>(initial)
  const [filter, setFilter] = useState<SeverityFilter>('all')

  useEffect(() => {
    setAnomalies(initial)
  }, [initial])

  const dismiss = (anomalyId: string) => {
    setAnomalies((current) =>
      current.map((anomaly) =>
        anomaly.id === anomalyId ? { ...anomaly, dismissed: true } : anomaly,
      ),
    )
  }

  const undismiss = (anomalyId: string) => {
    setAnomalies((current) =>
      current.map((anomaly) =>
        anomaly.id === anomalyId ? { ...anomaly, dismissed: false } : anomaly,
      ),
    )
  }

  const setAIExplanation = (anomalyId: string, text: string) => {
    setAnomalies((current) =>
      current.map((anomaly) =>
        anomaly.id === anomalyId ? { ...anomaly, aiExplanation: text } : anomaly,
      ),
    )
  }

  const filtered = useMemo(() => {
    const active = anomalies.filter((item) => !item.dismissed)
    if (filter === 'all') return active
    return active.filter((item) => item.severity === filter)
  }, [anomalies, filter])

  const dismissed = useMemo(() => anomalies.filter((item) => item.dismissed), [anomalies])

  return {
    anomalies,
    filtered,
    dismissed,
    filter,
    setFilter,
    dismiss,
    undismiss,
    setAIExplanation,
  }
}

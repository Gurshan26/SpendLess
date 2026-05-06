'use client'

import { useState } from 'react'
import AnomalyDetail from './AnomalyDetail'
import SeverityBadge from '@/components/shared/SeverityBadge'
import Button from '@/components/shared/Button'
import type { Anomaly } from '@/lib/types'

interface AnomalyCardProps {
  anomaly: Anomaly
  onDismiss: (id: string) => void
  onUndismiss?: (id: string) => void
  onAIExplain: (anomaly: Anomaly) => Promise<void>
  aiLoading?: boolean
  canAIExplain?: boolean
  aiBusy?: boolean
}

const borderBySeverity: Record<Anomaly['severity'], string> = {
  critical: 'border-l-[var(--critical)] bg-[var(--critical-bg)]/30',
  warning: 'border-l-[var(--warning)] bg-[var(--warning-bg)]/30',
  info: 'border-l-[var(--info)] bg-[var(--info-bg)]/30',
}

export default function AnomalyCard({
  anomaly,
  onDismiss,
  onUndismiss,
  onAIExplain,
  aiLoading = false,
  canAIExplain = true,
  aiBusy = false,
}: AnomalyCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)

  if (anomaly.dismissed) {
    return null
  }

  const dismissWithAnimation = () => {
    setIsDismissing(true)
    window.setTimeout(() => onDismiss(anomaly.id), 240)
  }

  return (
    <article
      role="article"
      aria-label={`Anomaly: ${anomaly.headline}`}
      data-testid="anomaly-card"
      className={`card border-l-4 p-4 transition-all ${borderBySeverity[anomaly.severity]} ${isDismissing ? 'slide-out' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <SeverityBadge severity={anomaly.severity} />
          <h3 className="text-lg font-semibold">{anomaly.headline}</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => setExpanded((value) => !value)}
            aria-label="View transactions"
          >
            {expanded ? 'Hide transactions' : 'View transactions'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => onAIExplain(anomaly)}
            loading={aiLoading}
            disabled={!canAIExplain || aiBusy}
            aria-label="Explain this anomaly with AI"
            title={
              canAIExplain
                ? aiBusy
                  ? 'AI is already working on another request'
                  : 'Get a clearer AI explanation'
                : 'AI explain needs a Gemini API key in .env.local'
            }
          >
            Explain this
          </Button>
          <Button
            variant="ghost"
            onClick={dismissWithAnimation}
            data-testid="dismiss-btn"
            aria-label="Dismiss anomaly"
          >
            Dismiss
          </Button>
          {onUndismiss ? (
            <Button variant="ghost" onClick={() => onUndismiss(anomaly.id)} aria-label="Undo dismiss">
              Undo
            </Button>
          ) : null}
        </div>
      </div>

      <p className="mt-3 text-sm text-[var(--ink-2)]">{anomaly.aiExplanation ?? anomaly.explanation}</p>
      <p className="mt-2 text-sm font-medium text-[var(--ink)]">{anomaly.suggestion}</p>

      {expanded ? <AnomalyDetail anomaly={anomaly} /> : null}
    </article>
  )
}

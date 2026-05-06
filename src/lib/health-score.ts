import type { Anomaly, RecurringCharge } from './types'

interface HealthScoreInput {
  anomalies: Anomaly[]
  spendVelocityRatio: number
  recurringCharges: RecurringCharge[]
}

export interface HealthScoreResult {
  score: number
  label: 'Looking good' | 'A few things to check' | 'Worth a closer look' | 'Needs attention'
  reasons: string[]
}

function getLabel(score: number): HealthScoreResult['label'] {
  if (score >= 80) return 'Looking good'
  if (score >= 60) return 'A few things to check'
  if (score >= 40) return 'Worth a closer look'
  return 'Needs attention'
}

export function calculateHealthScore(input: HealthScoreInput): HealthScoreResult {
  const { anomalies, spendVelocityRatio, recurringCharges } = input
  let score = 100
  const reasons: string[] = []

  const critical = anomalies.filter((item) => item.severity === 'critical').length
  const warning = anomalies.filter((item) => item.severity === 'warning').length
  const info = anomalies.filter((item) => item.severity === 'info').length

  score -= critical * 5
  score -= warning * 3
  score -= info

  if (critical > 0) reasons.push(`${critical} critical anomaly${critical > 1 ? 'ies' : 'y'} detected`)
  if (warning > 0) reasons.push(`${warning} warning${warning > 1 ? 's' : ''} flagged`)

  if (spendVelocityRatio > 1.5) {
    score -= 10
    reasons.push('Monthly spending velocity is running hot')
  }

  const hasPotentialDuplicate = anomalies.some((item) => item.type === 'duplicate_charge')
  if (hasPotentialDuplicate) {
    score -= 15
    reasons.push('Possible duplicate charge found')
  }

  const staleSubscriptions = recurringCharges.filter((charge) => {
    if (charge.frequency !== 'monthly') return false
    const daysSinceLast = (Date.now() - charge.lastSeen.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceLast > 30
  })

  if (staleSubscriptions.length >= 3) {
    score -= 5
    reasons.push('Several subscriptions look stale')
  }

  score = Math.max(0, Math.min(100, score))

  return {
    score,
    label: getLabel(score),
    reasons,
  }
}

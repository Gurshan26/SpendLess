import { v4 as uuidv4 } from 'uuid'
import { isDaytimeCategory } from './categorisation'
import { detectRecurringCharges, normaliseMerchant } from './recurring-detector'
import { mean, percentile, standardDeviation, zScore } from './statistics'
import type { Anomaly, AnomalyType, Transaction } from './types'

interface AnomalyDetectionConfig {
  zScoreWarningThreshold: number
  zScoreCriticalThreshold: number
  velocityWarningMultiplier: number
  duplicateWindowDays: number
  newMerchantMinAmount: number
}

const DEFAULT_CONFIG: AnomalyDetectionConfig = {
  zScoreWarningThreshold: 2.0,
  zScoreCriticalThreshold: 3.0,
  velocityWarningMultiplier: 1.75,
  duplicateWindowDays: 3,
  newMerchantMinAmount: 0,
}

const SEVERITY_WEIGHT: Record<Anomaly['severity'], number> = {
  critical: 3,
  warning: 2,
  info: 1,
}

function createAnomaly(params: {
  transactionIds: string[]
  type: AnomalyType
  severity: Anomaly['severity']
  headline: string
  explanation: string
  suggestion: string
  relatedTransactions: Transaction[]
}): Anomaly {
  return {
    id: uuidv4(),
    transactionIds: params.transactionIds,
    type: params.type,
    severity: params.severity,
    headline: params.headline,
    explanation: params.explanation,
    suggestion: params.suggestion,
    relatedTransactions: params.relatedTransactions,
    dismissed: false,
    detectedAt: new Date(),
  }
}

export function detectAnomalies(
  transactions: Transaction[],
  config: Partial<AnomalyDetectionConfig> = {},
): Anomaly[] {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  if (!transactions.length) return []

  const debits = transactions.filter(
    (txn) => txn.type === 'debit' && Number.isFinite(txn.amount) && txn.amount > 0,
  )
  if (!debits.length) return []

  const anomalies: Anomaly[] = []

  anomalies.push(...detectStatisticalOutliers(debits, cfg))
  anomalies.push(...detectIsolationForestApproximation(debits))
  anomalies.push(...detectSpendingVelocity(debits, cfg))
  anomalies.push(...detectRecurringSubscriptionAnomalies(debits))
  anomalies.push(...detectDuplicateCharges(debits, cfg))
  anomalies.push(...detectUnusualTiming(debits))
  anomalies.push(...detectCategoryDrift(debits))
  anomalies.push(...detectNewMerchants(debits, cfg))

  return deduplicateAnomalies(anomalies).sort((a, b) => {
    const severityDelta = SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity]
    if (severityDelta !== 0) return severityDelta
    return b.detectedAt.getTime() - a.detectedAt.getTime()
  })
}

function detectIsolationForestApproximation(transactions: Transaction[]): Anomaly[] {
  if (transactions.length < 12) return []
  const anomalies: Anomaly[] = []
  const amounts = transactions.map((txn) => txn.amount)
  const p25 = percentile(amounts, 25)
  const p50 = percentile(amounts, 50)
  const p75 = percentile(amounts, 75)
  const iqr = Math.max(1, p75 - p25)

  const byCategory = groupBy(transactions, (txn) => txn.category)

  transactions.forEach((txn) => {
    const category = byCategory[txn.category]
    const categoryMedian = percentile(
      category.map((item) => item.amount),
      50,
    )

    const amountDistance = Math.abs(txn.amount - p50) / iqr
    const categoryDistance = category.length >= 4 ? Math.abs(txn.amount - categoryMedian) / iqr : 0
    const timingPenalty = txn.date.getHours() >= 2 && txn.date.getHours() <= 5 ? 0.8 : 0

    const score = amountDistance * 0.7 + categoryDistance * 0.9 + timingPenalty
    if (score < 3.2) return

    const severity: Anomaly['severity'] = score >= 5 ? 'critical' : 'warning'
    anomalies.push(
      createAnomaly({
        transactionIds: [txn.id],
        type: 'statistical_outlier',
        severity,
        headline:
          severity === 'critical'
            ? `This charge looks isolated from your normal pattern`
            : `This one sits outside your usual spending cluster`,
        explanation: `$${txn.amount.toFixed(2)} at ${txn.merchant} is far from your typical transaction distribution. This stood out on an isolation-style anomaly pass, not just simple averages.`,
        suggestion: 'If this was expected, dismiss it. If not, verify merchant history and card activity.',
        relatedTransactions: [txn],
      }),
    )
  })

  return anomalies
}

function detectStatisticalOutliers(
  transactions: Transaction[],
  cfg: AnomalyDetectionConfig,
): Anomaly[] {
  const anomalies: Anomaly[] = []
  if (transactions.length < 5) return anomalies

  const overallAmounts = transactions.map((txn) => txn.amount)
  const overallMean = mean(overallAmounts)
  const overallStd = standardDeviation(overallAmounts)

  const byCategory = groupBy(transactions, (txn) => txn.category)

  for (const [category, txns] of Object.entries(byCategory)) {
    const categoryAmounts = txns.map((txn) => txn.amount)
    const useCategoryBaseline = txns.length >= 5
    const baselineMean = useCategoryBaseline ? mean(categoryAmounts) : overallMean
    const baselineStd = useCategoryBaseline ? standardDeviation(categoryAmounts) : overallStd

    if (baselineStd === 0) continue

    for (const txn of txns) {
      const z = zScore(txn.amount, baselineMean, baselineStd)
      const absZ = Math.abs(z)

      if (absZ >= cfg.zScoreCriticalThreshold) {
        const severity: Anomaly['severity'] = txn.amount > baselineMean * 5 ? 'critical' : 'warning'
        anomalies.push(
          createAnomaly({
            transactionIds: [txn.id],
            type: 'statistical_outlier',
            severity,
            headline:
              severity === 'critical'
                ? `Something looks off: ${txn.merchant} is way above your normal ${category} spend`
                : `Higher than usual ${category} spend`,
            explanation:
              severity === 'critical'
                ? `You spent $${txn.amount.toFixed(2)} at ${txn.merchant}. Your baseline for ${category} is about $${baselineMean.toFixed(2)}, so this is a big jump.`
                : `$${txn.amount.toFixed(2)} at ${txn.merchant} sits above your usual ${category} range. Your baseline is about $${baselineMean.toFixed(2)}.`,
            suggestion:
              severity === 'critical'
                ? 'Double-check the receipt or account activity to make sure this charge is legit.'
                : 'If this was expected, you can ignore it. If not, this is worth a quick review.',
            relatedTransactions: [txn],
          }),
        )
      } else if (absZ >= cfg.zScoreWarningThreshold) {
        anomalies.push(
          createAnomaly({
            transactionIds: [txn.id],
            type: 'statistical_outlier',
            severity: 'warning',
            headline: `You spent more than usual in ${category}`,
            explanation: `$${txn.amount.toFixed(2)} at ${txn.merchant} is above your typical ${category} amount of around $${baselineMean.toFixed(2)}.`,
            suggestion: 'Worth a quick check if this category has been creeping up lately.',
            relatedTransactions: [txn],
          }),
        )
      }
    }
  }

  return anomalies
}

function detectSpendingVelocity(
  transactions: Transaction[],
  cfg: AnomalyDetectionConfig,
): Anomaly[] {
  const anomalies: Anomaly[] = []

  const byWeek = groupBy(transactions, (txn) => getISOWeek(txn.date))
  const weekKeys = Object.keys(byWeek).sort()
  const weeklySeries = weekKeys.map((week) => ({
    week,
    total: byWeek[week].reduce((sum, txn) => sum + txn.amount, 0),
    transactions: byWeek[week],
  }))

  for (let index = 4; index < weeklySeries.length; index++) {
    const baselineWindow = weeklySeries.slice(index - 4, index)
    const baseline = mean(baselineWindow.map((item) => item.total))
    const current = weeklySeries[index]
    if (baseline <= 0) continue

    if (
      current.total > baseline * cfg.velocityWarningMultiplier &&
      current.total - baseline > 50
    ) {
      const multiplier = current.total / baseline
      anomalies.push(
        createAnomaly({
          transactionIds: current.transactions.map((txn) => txn.id),
          type: 'spending_velocity',
          severity: multiplier > 2.4 ? 'critical' : 'warning',
          headline: `Spending jumped to ${multiplier.toFixed(1)}x your normal week`,
          explanation: `This week landed at $${current.total.toFixed(2)} versus your recent weekly baseline of $${baseline.toFixed(2)}.`,
          suggestion: 'Open this week and scan for one-off purchases or repeat spend you did not expect.',
          relatedTransactions: current.transactions,
        }),
      )
    }
  }

  const byDay = groupBy(transactions, (txn) => formatDay(txn.date))
  const dailyTotals = Object.entries(byDay).map(([day, dayTxns]) => ({
    day,
    total: dayTxns.reduce((sum, txn) => sum + txn.amount, 0),
    transactions: dayTxns,
  }))

  const dailyAverage = mean(dailyTotals.map((item) => item.total))
  for (const day of dailyTotals) {
    if (dailyAverage <= 0) continue
    if (day.total > dailyAverage * 3) {
      anomalies.push(
        createAnomaly({
          transactionIds: day.transactions.map((txn) => txn.id),
          type: 'spending_velocity',
          severity: day.total > dailyAverage * 4 ? 'critical' : 'warning',
          headline: `Heavy spend day: $${day.total.toFixed(2)}`,
          explanation: `You spent $${day.total.toFixed(2)} in a single day. Your average day is about $${dailyAverage.toFixed(2)}.`,
          suggestion: 'Check what stacked up that day. Sometimes one category dominates the spike.',
          relatedTransactions: day.transactions,
        }),
      )
    }
  }

  return anomalies
}

function detectRecurringSubscriptionAnomalies(transactions: Transaction[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  const recurringCharges = detectRecurringCharges(transactions)

  for (const recurring of recurringCharges) {
    if (recurring.increased) {
      const lastTxn = recurring.transactions[recurring.transactions.length - 1]
      anomalies.push(
        createAnomaly({
          transactionIds: [lastTxn.id],
          type: 'subscription_increase',
          severity: 'warning',
          headline: `${recurring.merchantName} looks like it increased`,
          explanation: `This recurring charge moved up by about $${(recurring.increaseAmount ?? 0).toFixed(2)} since it first appeared. You're now paying roughly $${recurring.amount.toFixed(2)} ${recurring.frequency === 'monthly' ? 'per month' : 'per cycle'}.`,
          suggestion: 'If you still use it, keep it. If not, this is a good one to review.',
          relatedTransactions: [lastTxn],
        }),
      )
    }

    const likelyForgotten =
      recurring.frequency === 'monthly' &&
      recurring.amount > 15 &&
      (recurring.category === 'Entertainment' || recurring.category === 'Subscriptions')

    if (likelyForgotten) {
      const txns = recurring.transactions.slice(-2)
      anomalies.push(
        createAnomaly({
          transactionIds: txns.map((txn) => txn.id),
          type: 'forgotten_subscription',
          severity: 'warning',
          headline: `Possible forgotten subscription: ${recurring.merchantName}`,
          explanation: `$${recurring.amount.toFixed(2)} keeps coming out on a ${recurring.frequency} cycle. Annual cost is around $${recurring.estimatedAnnualCost.toFixed(2)}.`,
          suggestion: 'If this one is not actively useful, canceling it would free up cash quickly.',
          relatedTransactions: txns,
        }),
      )
    }
  }

  return anomalies
}

function detectDuplicateCharges(
  transactions: Transaction[],
  cfg: AnomalyDetectionConfig,
): Anomaly[] {
  const anomalies: Anomaly[] = []
  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime())

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i]
      const b = sorted[j]
      const daysDiff = Math.abs(a.date.getTime() - b.date.getTime()) / (1000 * 60 * 60 * 24)
      if (daysDiff > cfg.duplicateWindowDays) break

      const sameMerchant = normaliseMerchant(a.merchant) === normaliseMerchant(b.merchant)
      const sameAmount = Math.abs(a.amount - b.amount) < 0.01

      if (sameMerchant && sameAmount) {
        anomalies.push(
          createAnomaly({
            transactionIds: [a.id, b.id],
            type: 'duplicate_charge',
            severity: 'critical',
            headline: `Possible duplicate charge at ${a.merchant}`,
            explanation: `Two charges of $${a.amount.toFixed(2)} showed up within ${Math.round(daysDiff)} day(s). That can be a legit split payment, but it can also be a double-charge.`,
            suggestion: 'Check the merchant receipt or your bank app. If you only paid once, raise a dispute.',
            relatedTransactions: [a, b],
          }),
        )
      }
    }
  }

  return anomalies
}

function detectUnusualTiming(transactions: Transaction[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  const medianAmount = percentile(
    transactions.map((txn) => txn.amount),
    50,
  )

  const byDay = groupBy(transactions, (txn) => formatDay(txn.date))
  const dailyTotals = Object.values(byDay).map((dayTxns) =>
    dayTxns.reduce((sum, txn) => sum + txn.amount, 0),
  )
  const averageDaySpend = mean(dailyTotals)

  for (const txn of transactions) {
    const hour = txn.date.getHours()
    const day = txn.date.getDay()
    const isWeekend = day === 0 || day === 6

    if (hour >= 2 && hour <= 5) {
      const severity: Anomaly['severity'] = txn.amount > medianAmount * 2 ? 'critical' : 'warning'
      anomalies.push(
        createAnomaly({
          transactionIds: [txn.id],
          type: 'unusual_timing',
          severity,
          headline: `Unusual time transaction at ${txn.merchant}`,
          explanation: `$${txn.amount.toFixed(2)} was charged around ${formatHour(txn.date)}. That timing is uncommon for this kind of spend.`,
          suggestion: 'If this was not you, freeze the card and contact your bank quickly.',
          relatedTransactions: [txn],
        }),
      )
    }

    if (isWeekend && isDaytimeCategory(txn.category)) {
      anomalies.push(
        createAnomaly({
          transactionIds: [txn.id],
          type: 'unusual_timing',
          severity: txn.amount > medianAmount ? 'warning' : 'info',
          headline: `${txn.category} spend on a weekend`,
          explanation: `This ${txn.category.toLowerCase()} transaction hit on a weekend, which is unusual in your pattern.`,
          suggestion: 'Just verify it lines up with expected billing dates.',
          relatedTransactions: [txn],
        }),
      )
    }

    const dayKey = formatDay(txn.date)
    const monthEnd = isEndOfMonth(txn.date)
    if (monthEnd && (byDay[dayKey]?.reduce((sum, item) => sum + item.amount, 0) ?? 0) > averageDaySpend * 2.5) {
      anomalies.push(
        createAnomaly({
          transactionIds: byDay[dayKey].map((item) => item.id),
          type: 'unusual_timing',
          severity: 'info',
          headline: 'End-of-month spend cluster',
          explanation: `You had a concentrated spend burst near month-end on ${txn.date.toLocaleDateString()}. That pattern can hide small duplicate or impulse purchases.`,
          suggestion: 'Quick review tip: sort this day by amount and clear the big items first.',
          relatedTransactions: byDay[dayKey],
        }),
      )
    }
  }

  return anomalies
}

function detectCategoryDrift(transactions: Transaction[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  if (transactions.length < 8) return anomalies

  const latestDate = new Date(Math.max(...transactions.map((txn) => txn.date.getTime())))
  const currentMonth = latestDate.getMonth()
  const currentYear = latestDate.getFullYear()

  const previousMonthDate = new Date(currentYear, currentMonth - 1, 1)
  const previousMonth = previousMonthDate.getMonth()
  const previousYear = previousMonthDate.getFullYear()

  const current = transactions.filter(
    (txn) => txn.date.getMonth() === currentMonth && txn.date.getFullYear() === currentYear,
  )
  const previous = transactions.filter(
    (txn) => txn.date.getMonth() === previousMonth && txn.date.getFullYear() === previousYear,
  )

  if (!current.length || !previous.length) return anomalies

  const currentTotals = groupByAmount(current)
  const previousTotals = groupByAmount(previous)

  for (const [category, currentTotal] of Object.entries(currentTotals)) {
    const previousTotal = previousTotals[category] ?? 0
    if (previousTotal <= 0) continue

    const changePercent = ((currentTotal - previousTotal) / previousTotal) * 100
    if (changePercent > 50 && currentTotal > 50) {
      const severity: Anomaly['severity'] = changePercent > 100 ? 'warning' : 'info'

      const categoryTransactions = current.filter((txn) => txn.category === category)
      anomalies.push(
        createAnomaly({
          transactionIds: categoryTransactions.map((txn) => txn.id),
          type: 'category_drift',
          severity,
          headline: `${category} spend is up ${Math.round(changePercent)}% month over month`,
          explanation: `You spent $${currentTotal.toFixed(2)} on ${category} this month, up from $${previousTotal.toFixed(2)} last month.`,
          suggestion: 'Worth checking whether this is temporary or becoming a new baseline.',
          relatedTransactions: categoryTransactions,
        }),
      )
    }
  }

  return anomalies
}

function detectNewMerchants(transactions: Transaction[], cfg: AnomalyDetectionConfig): Anomaly[] {
  const anomalies: Anomaly[] = []
  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime())
  const medianAmount = percentile(
    sorted.map((txn) => txn.amount),
    50,
  )
  const minAmount = cfg.newMerchantMinAmount > 0 ? cfg.newMerchantMinAmount : medianAmount

  const seen = new Set<string>()
  const latestTimestamp = sorted[sorted.length - 1].date.getTime()

  for (const txn of sorted) {
    const merchantKey = normaliseMerchant(txn.merchant)
    if (seen.has(merchantKey)) continue
    seen.add(merchantKey)

    const daysFromLatest = (latestTimestamp - txn.date.getTime()) / (1000 * 60 * 60 * 24)
    if (txn.amount <= minAmount || daysFromLatest > 45) continue

    const severity: Anomaly['severity'] = txn.amount > medianAmount * 2 ? 'warning' : 'info'
    anomalies.push(
      createAnomaly({
        transactionIds: [txn.id],
        type: 'new_merchant',
        severity,
        headline: `First time seeing ${txn.merchant}`,
        explanation: `$${txn.amount.toFixed(2)} at ${txn.merchant} is a new merchant in your history.`,
        suggestion: 'If this does not ring a bell, review the card activity right away.',
        relatedTransactions: [txn],
      }),
    )
  }

  return anomalies
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const grouped: Record<string, T[]> = {}
  for (const item of items) {
    const key = keyFn(item)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(item)
  }
  return grouped
}

function groupByAmount(transactions: Transaction[]): Record<string, number> {
  return transactions.reduce<Record<string, number>>((acc, txn) => {
    acc[txn.category] = (acc[txn.category] ?? 0) + txn.amount
    return acc
  }, {})
}

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

function formatDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

function formatHour(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function isEndOfMonth(date: Date): boolean {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  return lastDay - date.getDate() <= 2
}

function deduplicateAnomalies(anomalies: Anomaly[]): Anomaly[] {
  const bestByKey = new Map<string, Anomaly>()

  for (const anomaly of anomalies) {
    const txnKey = [...anomaly.transactionIds].sort().join('|')
    const existing = bestByKey.get(txnKey)

    if (!existing) {
      bestByKey.set(txnKey, anomaly)
      continue
    }

    const currentWeight = SEVERITY_WEIGHT[anomaly.severity]
    const existingWeight = SEVERITY_WEIGHT[existing.severity]

    if (currentWeight > existingWeight) {
      bestByKey.set(txnKey, anomaly)
      continue
    }

    if (currentWeight === existingWeight) {
      if (anomaly.relatedTransactions.length > existing.relatedTransactions.length) {
        bestByKey.set(txnKey, anomaly)
      }
    }
  }

  return [...bestByKey.values()]
}

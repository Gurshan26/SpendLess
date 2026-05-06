import { v4 as uuidv4 } from 'uuid'
import type { RecurringCharge, Transaction } from './types'

interface FrequencyRule {
  key: 'weekly' | 'biweekly' | 'monthly'
  targetDays: number
  tolerance: number
  annualMultiplier: number
}

const FREQUENCY_RULES: FrequencyRule[] = [
  { key: 'weekly', targetDays: 7, tolerance: 2, annualMultiplier: 52 },
  { key: 'biweekly', targetDays: 14, tolerance: 2, annualMultiplier: 26 },
  { key: 'monthly', targetDays: 28, tolerance: 3, annualMultiplier: 12 },
]

export function normaliseMerchant(name: string): string {
  return name
    .toUpperCase()
    .replace(/\*+\d+/g, '')
    .replace(/\b(PTY|LTD|INC|COM|AU|US)\b/g, '')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function daysBetween(a: Date, b: Date): number {
  const ms = Math.abs(a.getTime() - b.getTime())
  return ms / (1000 * 60 * 60 * 24)
}

function detectFrequency(transactions: Transaction[]): FrequencyRule | null {
  if (transactions.length < 3) return null
  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime())
  const gaps = sorted.slice(1).map((txn, index) => daysBetween(txn.date, sorted[index].date))

  for (const rule of FREQUENCY_RULES) {
    const matchCount = gaps.filter((gap) => Math.abs(gap - rule.targetDays) <= rule.tolerance).length
    if (matchCount >= Math.max(2, Math.floor(gaps.length * 0.6))) {
      return rule
    }
  }

  return null
}

function approximateSameAmount(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function withinPercent(value: number, target: number, tolerancePercent: number): boolean {
  if (target === 0) return false
  return Math.abs(value - target) / target <= tolerancePercent / 100
}

function hasSubscriptionIncreasePattern(amounts: number[]): boolean {
  if (amounts.length < 4) return false

  const split = Math.floor(amounts.length / 2)
  const firstHalf = amounts.slice(0, split)
  const secondHalf = amounts.slice(split)
  if (firstHalf.length === 0 || secondHalf.length === 0) return false

  const firstMean = approximateSameAmount(firstHalf)
  const secondMean = approximateSameAmount(secondHalf)
  if (secondMean <= firstMean) return false

  const firstConsistent = firstHalf.every((amount) => withinPercent(amount, firstMean, 8))
  const secondConsistent = secondHalf.every((amount) => withinPercent(amount, secondMean, 8))
  const increaseReasonable = secondMean <= firstMean * 1.35

  return firstConsistent && secondConsistent && increaseReasonable
}

export function detectRecurringCharges(transactions: Transaction[]): RecurringCharge[] {
  const debits = transactions.filter((txn) => txn.type === 'debit')
  const merchantGroups = new Map<string, Transaction[]>()

  for (const txn of debits) {
    const clean = normaliseMerchant(txn.merchant)
    const existing = merchantGroups.get(clean)
    if (existing) {
      existing.push(txn)
    } else {
      merchantGroups.set(clean, [txn])
    }
  }

  const recurring: RecurringCharge[] = []

  merchantGroups.forEach((group, cleanName) => {
    if (group.length < 3) return

    const sorted = [...group].sort((a, b) => a.date.getTime() - b.date.getTime())
    const avgAmount = approximateSameAmount(sorted.map((txn) => txn.amount))
    const amounts = sorted.map((txn) => txn.amount)
    const amountConsistentCount = amounts.filter((amount) => withinPercent(amount, avgAmount, 5)).length
    const strictConsistency = amountConsistentCount >= Math.max(3, Math.floor(sorted.length * 0.7))
    const increasedPlanPattern = hasSubscriptionIncreasePattern(amounts)

    if (!strictConsistency && !increasedPlanPattern) return

    const freqRule = detectFrequency(sorted)
    if (!freqRule) return

    const firstAmount = sorted[0].amount
    const lastAmount = sorted[sorted.length - 1].amount
    const increased = lastAmount > firstAmount * 1.02

    recurring.push({
      id: uuidv4(),
      merchantName: sorted[0].merchant,
      cleanName,
      frequency: freqRule.key,
      amount: Number(avgAmount.toFixed(2)),
      firstSeen: sorted[0].date,
      lastSeen: sorted[sorted.length - 1].date,
      occurrences: sorted.length,
      totalSpent: Number(sorted.reduce((sum, txn) => sum + txn.amount, 0).toFixed(2)),
      estimatedAnnualCost: Number((avgAmount * freqRule.annualMultiplier).toFixed(2)),
      category: sorted[0].category,
      increased,
      increaseAmount: increased ? Number((lastAmount - firstAmount).toFixed(2)) : undefined,
      transactions: sorted,
    })
  })

  return recurring.sort((a, b) => b.estimatedAnnualCost - a.estimatedAnnualCost)
}

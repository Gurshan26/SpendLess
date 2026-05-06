import { detectAnomalies } from './anomaly-detection'
import { detectRecurringCharges } from './recurring-detector'
import { calculateHealthScore } from './health-score'
import { mean } from './statistics'
import type {
  Anomaly,
  Category,
  CategorySummary,
  FinancialSummary,
  MerchantSummary,
  RecurringCharge,
  Transaction,
} from './types'

export const PEER_BENCHMARKS: Record<Category, number> = {
  Groceries: 18,
  'Dining & Restaurants': 23,
  Transport: 12,
  Entertainment: 6,
  Shopping: 10,
  Utilities: 9,
  Healthcare: 5,
  Travel: 4,
  Subscriptions: 5,
  Income: 0,
  Transfers: 3,
  'Fees & Charges': 2,
  Education: 2,
  'Personal Care': 3,
  Other: 8,
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

function mostRecentMonth(transactions: Transaction[]): Date {
  const latest = new Date(Math.max(...transactions.map((txn) => txn.date.getTime())))
  return new Date(latest.getFullYear(), latest.getMonth(), 1)
}

function previousMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1)
}

function getMonthlyTotals(transactions: Transaction[]): { month: string; amount: number }[] {
  const byMonth = new Map<string, number>()

  transactions.forEach((txn) => {
    if (txn.type !== 'debit') return
    const key = monthKey(txn.date)
    byMonth.set(key, (byMonth.get(key) ?? 0) + txn.amount)
  })

  return [...byMonth.entries()]
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .map(([month, amount]) => {
      const [yearStr, monthStr] = month.split('-')
      const date = new Date(Number(yearStr), Number(monthStr) - 1, 1)
      return {
        month: monthLabel(date),
        amount: Number(amount.toFixed(2)),
      }
    })
}

function categorySummaries(transactions: Transaction[]): CategorySummary[] {
  const debits = transactions.filter((txn) => txn.type === 'debit')
  const totalSpend = debits.reduce((sum, txn) => sum + txn.amount, 0)
  if (!debits.length || totalSpend === 0) return []

  const currentMonthDate = mostRecentMonth(debits)
  const prevMonthDate = previousMonth(currentMonthDate)

  const byCategory = new Map<Category, Transaction[]>()
  debits.forEach((txn) => {
    const list = byCategory.get(txn.category) ?? []
    list.push(txn)
    byCategory.set(txn.category, list)
  })

  return [...byCategory.entries()]
    .map(([category, txns]) => {
      const totalAmount = txns.reduce((sum, txn) => sum + txn.amount, 0)
      const currentMonthAmount = txns
        .filter(
          (txn) =>
            txn.date.getMonth() === currentMonthDate.getMonth() &&
            txn.date.getFullYear() === currentMonthDate.getFullYear(),
        )
        .reduce((sum, txn) => sum + txn.amount, 0)

      const previousMonthAmount = txns
        .filter(
          (txn) =>
            txn.date.getMonth() === prevMonthDate.getMonth() &&
            txn.date.getFullYear() === prevMonthDate.getFullYear(),
        )
        .reduce((sum, txn) => sum + txn.amount, 0)

      const changePercent =
        previousMonthAmount > 0
          ? ((currentMonthAmount - previousMonthAmount) / previousMonthAmount) * 100
          : currentMonthAmount > 0
            ? 100
            : 0

      const merchantCounts = new Map<string, number>()
      txns.forEach((txn) => {
        merchantCounts.set(txn.merchant, (merchantCounts.get(txn.merchant) ?? 0) + txn.amount)
      })

      const topMerchants = [...merchantCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([merchant]) => merchant)

      return {
        category,
        totalAmount: Number(totalAmount.toFixed(2)),
        transactionCount: txns.length,
        percentage: Number(((totalAmount / totalSpend) * 100).toFixed(1)),
        previousMonthAmount: Number(previousMonthAmount.toFixed(2)),
        changePercent: Number(changePercent.toFixed(1)),
        avgTransactionAmount: Number((totalAmount / txns.length).toFixed(2)),
        topMerchants,
      }
    })
    .sort((a, b) => b.totalAmount - a.totalAmount)
}

function merchantSummaries(
  transactions: Transaction[],
  recurringCharges: RecurringCharge[],
): MerchantSummary[] {
  const debits = transactions.filter((txn) => txn.type === 'debit')
  const byMerchant = new Map<string, Transaction[]>()

  debits.forEach((txn) => {
    const key = txn.merchant
    const list = byMerchant.get(key) ?? []
    list.push(txn)
    byMerchant.set(key, list)
  })

  const recurringSet = new Set(recurringCharges.map((item) => item.cleanName))

  return [...byMerchant.entries()]
    .map(([merchantName, txns]) => {
      const sorted = [...txns].sort((a, b) => a.date.getTime() - b.date.getTime())
      const totalAmount = txns.reduce((sum, txn) => sum + txn.amount, 0)
      return {
        merchantName,
        totalAmount: Number(totalAmount.toFixed(2)),
        transactionCount: txns.length,
        category: txns[0].category,
        isRecurring: recurringSet.has(merchantName.toUpperCase().replace(/[^A-Z0-9]/g, '')),
        firstSeen: sorted[0].date,
        lastSeen: sorted[sorted.length - 1].date,
      }
    })
    .sort((a, b) => b.totalAmount - a.totalAmount)
}

function spendVelocityRatio(transactions: Transaction[]): number {
  const debits = transactions.filter((txn) => txn.type === 'debit')
  const monthTotals = new Map<string, number>()

  debits.forEach((txn) => {
    const key = monthKey(txn.date)
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + txn.amount)
  })

  const totals = [...monthTotals.values()]
  if (totals.length < 2) return 1

  const latest = totals[totals.length - 1]
  const previousAverage = mean(totals.slice(0, -1))
  if (previousAverage === 0) return 1

  return latest / previousAverage
}

export function buildFinancialSummary(transactions: Transaction[]): FinancialSummary {
  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime())
  const debits = sorted.filter((txn) => txn.type === 'debit')
  const credits = sorted.filter((txn) => txn.type === 'credit')

  const anomalies = detectAnomalies(sorted)
  const recurringCharges = detectRecurringCharges(sorted)
  const categoryBreakdown = categorySummaries(sorted)
  const topMerchants = merchantSummaries(sorted, recurringCharges)

  const latestMonth = debits.length ? mostRecentMonth(debits) : new Date()
  const prior = previousMonth(latestMonth)

  const currentMonthSpend = debits
    .filter(
      (txn) =>
        txn.date.getMonth() === latestMonth.getMonth() &&
        txn.date.getFullYear() === latestMonth.getFullYear(),
    )
    .reduce((sum, txn) => sum + txn.amount, 0)

  const previousMonthSpend = debits
    .filter(
      (txn) => txn.date.getMonth() === prior.getMonth() && txn.date.getFullYear() === prior.getFullYear(),
    )
    .reduce((sum, txn) => sum + txn.amount, 0)

  const monthOverMonthChange =
    previousMonthSpend > 0
      ? ((currentMonthSpend - previousMonthSpend) / previousMonthSpend) * 100
      : currentMonthSpend > 0
        ? 100
        : 0

  const totalSpend = debits.reduce((sum, txn) => sum + txn.amount, 0)
  const totalIncome = credits.reduce((sum, txn) => sum + txn.amount, 0)

  const monthlyTotals = getMonthlyTotals(sorted)
  const averageMonthlySpend =
    monthlyTotals.length > 0
      ? monthlyTotals.reduce((sum, item) => sum + item.amount, 0) / monthlyTotals.length
      : 0

  const velocityRatio = spendVelocityRatio(sorted)
  const health = calculateHealthScore({
    anomalies,
    spendVelocityRatio: velocityRatio,
    recurringCharges,
  })

  const summary: FinancialSummary = {
    totalSpend: Number(totalSpend.toFixed(2)),
    totalIncome: Number(totalIncome.toFixed(2)),
    netFlow: Number((totalIncome - totalSpend).toFixed(2)),
    averageMonthlySpend: Number(averageMonthlySpend.toFixed(2)),
    currentMonthSpend: Number(currentMonthSpend.toFixed(2)),
    previousMonthSpend: Number(previousMonthSpend.toFixed(2)),
    monthOverMonthChange: Number(monthOverMonthChange.toFixed(1)),
    transactionCount: sorted.length,
    dateRange: {
      start: sorted[0]?.date ?? new Date(),
      end: sorted[sorted.length - 1]?.date ?? new Date(),
    },
    categoryBreakdown,
    topMerchants,
    recurringCharges,
    anomalies,
    healthScore: health.score,
    monthlyTotals,
  }

  return summary
}

export function anomaliesByTransactionId(anomalies: Anomaly[]): Map<string, Anomaly[]> {
  const map = new Map<string, Anomaly[]>()
  anomalies.forEach((anomaly) => {
    anomaly.transactionIds.forEach((transactionId) => {
      const current = map.get(transactionId) ?? []
      current.push(anomaly)
      map.set(transactionId, current)
    })
  })
  return map
}

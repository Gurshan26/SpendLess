import type { Transaction } from './types'

export interface SpendForecast {
  projectedMonthSpend: number
  currentSpend: number
  daysElapsed: number
  daysInMonth: number
  dailyRunRate: number
  comparedToLastMonth: number
  confidence: 'low' | 'medium' | 'high'
}

export function projectEndOfMonthSpend(transactions: Transaction[], now: Date = new Date()): SpendForecast {
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const currentMonthDebits = transactions.filter(
    (txn) => txn.type === 'debit' && txn.date.getMonth() === currentMonth && txn.date.getFullYear() === currentYear,
  )

  const lastMonthDate = new Date(currentYear, currentMonth - 1, 1)
  const lastMonth = lastMonthDate.getMonth()
  const lastMonthYear = lastMonthDate.getFullYear()

  const lastMonthSpend = transactions
    .filter(
      (txn) => txn.type === 'debit' && txn.date.getMonth() === lastMonth && txn.date.getFullYear() === lastMonthYear,
    )
    .reduce((sum, txn) => sum + txn.amount, 0)

  const currentSpend = currentMonthDebits.reduce((sum, txn) => sum + txn.amount, 0)
  const daysElapsed = Math.max(1, now.getDate())
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const dailyRunRate = currentSpend / daysElapsed
  const projectedMonthSpend = dailyRunRate * daysInMonth

  const comparedToLastMonth = lastMonthSpend > 0 ? ((projectedMonthSpend - lastMonthSpend) / lastMonthSpend) * 100 : 0

  const progress = daysElapsed / daysInMonth
  const confidence: 'low' | 'medium' | 'high' =
    progress < 0.25 ? 'low' : progress < 0.6 ? 'medium' : 'high'

  return {
    projectedMonthSpend: Number(projectedMonthSpend.toFixed(2)),
    currentSpend: Number(currentSpend.toFixed(2)),
    daysElapsed,
    daysInMonth,
    dailyRunRate: Number(dailyRunRate.toFixed(2)),
    comparedToLastMonth: Number(comparedToLastMonth.toFixed(1)),
    confidence,
  }
}

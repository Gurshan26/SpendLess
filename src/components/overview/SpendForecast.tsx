import MoneyAmount from '@/components/shared/MoneyAmount'
import type { SpendForecast as SpendForecastType } from '@/lib/forecasting'

interface SpendForecastProps {
  forecast: SpendForecastType
}

export default function SpendForecast({ forecast }: SpendForecastProps) {
  return (
    <article className="card p-5">
      <p className="text-sm text-[var(--ink-3)]">End-of-month forecast</p>
      <p className="mt-2 text-2xl font-semibold">
        <MoneyAmount amount={forecast.projectedMonthSpend} />
      </p>
      <p className="mt-2 text-sm text-[var(--ink-2)]">
        Based on {forecast.daysElapsed} of {forecast.daysInMonth} days. Daily pace is{' '}
        <span className="money">${forecast.dailyRunRate.toFixed(2)}</span>.
      </p>
      <p className="mt-1 text-sm text-[var(--ink-2)]">
        {forecast.comparedToLastMonth >= 0 ? 'Up' : 'Down'} {Math.abs(forecast.comparedToLastMonth).toFixed(1)}% vs last month.
      </p>
    </article>
  )
}

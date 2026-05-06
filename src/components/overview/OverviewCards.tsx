import MoneyAmount from '@/components/shared/MoneyAmount'

interface OverviewCardsProps {
  currentMonthSpend: number
  previousMonthSpend: number
  monthOverMonthChange: number
  anomalyCount: number
  runRate: number
}

export default function OverviewCards({
  currentMonthSpend,
  previousMonthSpend,
  monthOverMonthChange,
  anomalyCount,
  runRate,
}: OverviewCardsProps) {
  const cards = [
    {
      label: 'Total spend this month',
      value: <MoneyAmount amount={currentMonthSpend} className="text-2xl font-semibold" />,
      detail: `Last month: $${previousMonthSpend.toFixed(2)}`,
    },
    {
      label: 'Vs last month',
      value: (
        <span className={`money text-2xl font-semibold ${monthOverMonthChange >= 0 ? 'text-[var(--warning)]' : 'text-[var(--ok)]'}`}>
          {monthOverMonthChange >= 0 ? '+' : ''}
          {monthOverMonthChange.toFixed(1)}%
        </span>
      ),
      detail: monthOverMonthChange >= 0 ? 'Spending is up' : 'Spending is down',
    },
    {
      label: 'Anomalies detected',
      value: <span className="text-2xl font-semibold">{anomalyCount}</span>,
      detail: anomalyCount === 0 ? 'No weird transactions this month' : 'Sorted by severity and date',
    },
    {
      label: 'Estimated monthly run-rate',
      value: <MoneyAmount amount={runRate} className="text-2xl font-semibold" />,
      detail: 'Projected from your current pace',
    },
  ]

  return (
    <section data-testid="overview-cards" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="card p-5">
          <p className="text-sm text-[var(--ink-3)]">{card.label}</p>
          <div className="mt-2">{card.value}</div>
          <p className="mt-2 text-sm text-[var(--ink-2)]">{card.detail}</p>
        </article>
      ))}
    </section>
  )
}

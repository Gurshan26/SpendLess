import MoneyAmount from '@/components/shared/MoneyAmount'
import type { RecurringCharge } from '@/lib/types'

interface SubscriptionTrackerProps {
  recurringCharges: RecurringCharge[]
}

export default function SubscriptionTracker({ recurringCharges }: SubscriptionTrackerProps) {
  const monthlyOrSubscription = recurringCharges.filter(
    (charge) => charge.frequency === 'monthly' || charge.category === 'Subscriptions',
  )
  const annualTotal = monthlyOrSubscription.reduce((sum, charge) => sum + charge.estimatedAnnualCost, 0)

  return (
    <section data-testid="subscription-tracker" className="card space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Subscription tracker</h3>
          <p className="text-sm text-[var(--ink-2)]">All recurring charges, with annual cost made obvious.</p>
        </div>
        <p className="text-right text-sm text-[var(--ink-2)]">
          Estimated annual total
          <br />
          <MoneyAmount amount={annualTotal} className="text-lg font-semibold" />
        </p>
      </div>

      <div className="space-y-2">
        {monthlyOrSubscription.map((charge) => (
          <article key={charge.id} className="rounded-lg border border-[var(--border)] bg-white p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{charge.merchantName}</p>
                <p className="text-xs text-[var(--ink-3)]">
                  {charge.frequency} · {charge.occurrences} charges seen
                </p>
              </div>
              <div className="text-right">
                <p className="money">${charge.amount.toFixed(2)}</p>
                <p className="money text-xs text-[var(--ink-3)]">${charge.estimatedAnnualCost.toFixed(2)}/yr</p>
              </div>
            </div>
            {charge.increased ? (
              <p className="mt-1 text-xs text-[var(--warning)]">
                Increased by ${charge.increaseAmount?.toFixed(2) ?? '0.00'} since first detected.
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

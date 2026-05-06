'use client'

import { useMemo, useState } from 'react'
import MerchantDetail from './MerchantDetail'
import type { MerchantSummary, Transaction } from '@/lib/types'

interface MerchantListProps {
  merchants: MerchantSummary[]
  transactions: Transaction[]
  firstTimeMerchantNames: string[]
}

export default function MerchantList({
  merchants,
  transactions,
  firstTimeMerchantNames,
}: MerchantListProps) {
  const [query, setQuery] = useState('')
  const [activeMerchant, setActiveMerchant] = useState<string | null>(merchants[0]?.merchantName ?? null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return merchants
    return merchants.filter((merchant) => merchant.merchantName.toLowerCase().includes(q))
  }, [merchants, query])

  return (
    <section data-testid="merchant-list" className="space-y-4">
      <div>
        <h2 className="section-title">Merchant Insights</h2>
        <p className="section-subtitle">Who gets most of your money, and who just showed up for the first time.</p>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search merchant"
        aria-label="Search merchant"
        className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <div className="card p-4">
          <ul className="space-y-2">
            {filtered.slice(0, 20).map((merchant) => {
              const isFirstTime = firstTimeMerchantNames.includes(merchant.merchantName)
              return (
                <li key={merchant.merchantName}>
                  <button
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                      activeMerchant === merchant.merchantName
                        ? 'border-[var(--accent)] bg-[var(--accent-light)]/60'
                        : 'border-[var(--border)] bg-white'
                    }`}
                    onClick={() => setActiveMerchant(merchant.merchantName)}
                    aria-label={`Open merchant ${merchant.merchantName}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{merchant.merchantName}</span>
                      <span className="money">${merchant.totalAmount.toFixed(2)}</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--ink-3)]">
                      {merchant.transactionCount} transactions
                      {isFirstTime ? ' · first-time merchant flagged' : ''}
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <MerchantDetail merchant={activeMerchant} transactions={transactions} />
      </div>
    </section>
  )
}

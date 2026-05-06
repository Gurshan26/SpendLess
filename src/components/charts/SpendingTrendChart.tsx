'use client'

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface SpendingTrendChartProps {
  monthlyTotals: { month: string; amount: number }[]
}

export default function SpendingTrendChart({ monthlyTotals }: SpendingTrendChartProps) {
  return (
    <div className="card h-80 p-4">
      <p className="mb-2 text-sm text-[var(--ink-3)]">Month-over-month spend trend</p>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={monthlyTotals} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E0" />
          <XAxis dataKey="month" tick={{ fill: '#78716C', fontSize: 12 }} />
          <YAxis tick={{ fill: '#78716C', fontSize: 12 }} />
          <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
          <Line type="monotone" dataKey="amount" stroke="#7C3AED" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

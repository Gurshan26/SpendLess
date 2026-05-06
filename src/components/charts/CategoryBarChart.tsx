'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CategorySummary } from '@/lib/types'

interface CategoryBarChartProps {
  data: CategorySummary[]
}

export default function CategoryBarChart({ data }: CategoryBarChartProps) {
  const chartData = data.slice(0, 8).map((item) => ({
    category: item.category,
    current: Number(item.totalAmount.toFixed(2)),
    previous: Number(item.previousMonthAmount.toFixed(2)),
  }))

  return (
    <div className="card h-80 p-4" data-testid="month-comparison-chart">
      <p className="mb-2 text-sm text-[var(--ink-3)]">Current month vs last month by category</p>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E0" />
          <XAxis type="number" tick={{ fill: '#78716C', fontSize: 12 }} />
          <YAxis type="category" dataKey="category" width={110} tick={{ fill: '#44403C', fontSize: 11 }} />
          <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
          <Bar dataKey="previous" fill="#D6D3CE" radius={4} />
          <Bar dataKey="current" fill="#7C3AED" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

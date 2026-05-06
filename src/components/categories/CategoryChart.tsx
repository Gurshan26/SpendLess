'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { CategorySummary } from '@/lib/types'

interface CategoryChartProps {
  data: CategorySummary[]
}

const COLORS = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#0EA5E9', '#8B5CF6', '#10B981']

export default function CategoryChart({ data }: CategoryChartProps) {
  const chartData = data.slice(0, 8).map((item) => ({
    name: item.category,
    value: item.totalAmount,
  }))

  return (
    <div className="card h-80 p-4">
      <p className="mb-2 text-sm text-[var(--ink-3)]">Category share this month</p>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={112}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

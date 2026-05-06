'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface MonthComparisonChartProps {
  data: { month: string; amount: number }[]
}

export default function MonthComparisonChart({ data }: MonthComparisonChartProps) {
  return (
    <div className="card h-72 p-4">
      <p className="mb-2 text-sm text-[var(--ink-3)]">Monthly spending profile</p>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E0" />
          <XAxis dataKey="month" tick={{ fill: '#78716C', fontSize: 12 }} />
          <YAxis tick={{ fill: '#78716C', fontSize: 12 }} />
          <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
          <Area type="monotone" dataKey="amount" stroke="#5B21B6" fill="#EDE9FE" fillOpacity={1} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

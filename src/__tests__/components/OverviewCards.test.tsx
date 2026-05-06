import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import OverviewCards from '@/components/overview/OverviewCards'

describe('OverviewCards', () => {
  it('renders all overview labels', () => {
    render(
      <OverviewCards
        currentMonthSpend={2400}
        previousMonthSpend={2000}
        monthOverMonthChange={20}
        anomalyCount={4}
        runRate={2600}
      />,
    )

    expect(screen.getByText(/Total spend this month/i)).toBeInTheDocument()
    expect(screen.getByText(/Vs last month/i)).toBeInTheDocument()
    expect(screen.getByText(/Anomalies detected/i)).toBeInTheDocument()
    expect(screen.getByText(/Estimated monthly run-rate/i)).toBeInTheDocument()
  })
})

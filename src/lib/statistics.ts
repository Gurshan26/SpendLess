export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0
  const avg = mean(values)
  const squaredDiffs = values.map((value) => (value - avg) ** 2)
  return Math.sqrt(mean(squaredDiffs))
}

export function zScore(value: number, avg: number, std: number): number {
  if (std === 0) return 0
  return (value - avg) / std
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const clampedP = Math.min(100, Math.max(0, p))
  const index = (clampedP / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  const fraction = index - lower
  return sorted[lower] + (sorted[upper] - sorted[lower]) * fraction
}

export function movingAverage(values: number[], window: number): number[] {
  if (window <= 0) return [...values]
  return values.map((_, index) => {
    const start = Math.max(0, index - window + 1)
    const slice = values.slice(start, index + 1)
    return mean(slice)
  })
}

export function trendSlope(values: number[]): number {
  const n = values.length
  if (n < 2) return 0

  const xMean = (n - 1) / 2
  const yMean = mean(values)

  let numerator = 0
  let denominator = 0

  for (let i = 0; i < n; i++) {
    const xDiff = i - xMean
    const yDiff = values[i] - yMean
    numerator += xDiff * yDiff
    denominator += xDiff ** 2
  }

  return denominator === 0 ? 0 : numerator / denominator
}

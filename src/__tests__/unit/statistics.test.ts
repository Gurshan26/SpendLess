import { describe, expect, it } from 'vitest'
import { mean, movingAverage, percentile, standardDeviation, trendSlope, zScore } from '@/lib/statistics'

describe('mean', () => {
  it('calculates mean', () => expect(mean([1, 2, 3, 4, 5])).toBe(3))
  it('returns 0 for empty', () => expect(mean([])).toBe(0))
})

describe('standardDeviation', () => {
  it('returns 0 for insufficient values', () => {
    expect(standardDeviation([])).toBe(0)
    expect(standardDeviation([5])).toBe(0)
  })

  it('returns 0 for identical values', () => {
    expect(standardDeviation([3, 3, 3])).toBe(0)
  })

  it('calculates deviation', () => {
    expect(standardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2, 0)
  })
})

describe('zScore', () => {
  it('returns 0 with zero std', () => expect(zScore(5, 5, 0)).toBe(0))
  it('returns positive and negative scores', () => {
    expect(zScore(9, 5, 2)).toBe(2)
    expect(zScore(1, 5, 2)).toBe(-2)
  })
})

describe('percentile', () => {
  it('handles empty array', () => expect(percentile([], 50)).toBe(0))
  it('returns median', () => expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3))
})

describe('movingAverage', () => {
  it('returns same length', () => {
    expect(movingAverage([1, 2, 3, 4, 5], 3)).toHaveLength(5)
  })
})

describe('trendSlope', () => {
  it('returns positive for increasing series', () => {
    expect(trendSlope([1, 2, 3, 4, 5])).toBeGreaterThan(0)
  })

  it('returns negative for decreasing series', () => {
    expect(trendSlope([5, 4, 3, 2, 1])).toBeLessThan(0)
  })

  it('returns zero for flat series', () => {
    expect(trendSlope([5, 5, 5, 5, 5])).toBe(0)
  })
})

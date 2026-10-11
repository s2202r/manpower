import { describe, it, expect } from 'vitest'
import { calculateFees } from '../fees'

const NOW = new Date()
const LONG_AGO = new Date(NOW.getTime() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
const RECENT = new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000)  // 10 days ago

describe('calculateFees', () => {
  it('applies poster 5% fee', () => {
    const r = calculateFees({ amountPaise: 100000n, taskerCompletedTasks: 0, taskerFirstTaskAt: null })
    expect(r.posterFeePaise).toBe(5000n)
  })

  it('enforces ₹19 minimum poster fee', () => {
    const r = calculateFees({ amountPaise: 20000n, taskerCompletedTasks: 0, taskerFirstTaskAt: null })
    // 5% of 200 = ₹10, less than ₹19 minimum
    expect(r.posterFeePaise).toBe(1900n)
  })

  it('applies 0% tasker fee within first 60 days', () => {
    const r = calculateFees({ amountPaise: 100000n, taskerCompletedTasks: 0, taskerFirstTaskAt: RECENT })
    expect(r.taskerFeePaise).toBe(0n)
  })

  it('applies 10% default tasker fee after 60 days', () => {
    const r = calculateFees({ amountPaise: 100000n, taskerCompletedTasks: 5, taskerFirstTaskAt: LONG_AGO })
    expect(r.taskerFeePaise).toBe(10000n)
  })

  it('applies 7% veteran tasker fee after 20 tasks', () => {
    const r = calculateFees({ amountPaise: 100000n, taskerCompletedTasks: 20, taskerFirstTaskAt: LONG_AGO })
    expect(r.taskerFeePaise).toBe(7000n)
  })

  it('tasker payout is amount minus tasker fee and GST on tasker fee', () => {
    const r = calculateFees({ amountPaise: 100000n, taskerCompletedTasks: 5, taskerFirstTaskAt: LONG_AGO })
    expect(r.taskerPayoutPaise).toBe(100000n - r.taskerFeePaise - r.gstOnTaskerFeePaise)
  })

  it('GST is 18% on poster fee', () => {
    const r = calculateFees({ amountPaise: 100000n, taskerCompletedTasks: 0, taskerFirstTaskAt: null })
    // 18% of 5000 = 900
    expect(r.gstOnPosterFeePaise).toBe(900n)
  })

  it('throws on zero amount', () => {
    expect(() => calculateFees({ amountPaise: 0n, taskerCompletedTasks: 0, taskerFirstTaskAt: null })).toThrow()
  })
})

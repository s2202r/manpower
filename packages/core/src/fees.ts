import { FEES } from '@taim/config'

export interface FeeInput {
  amountPaise: bigint
  taskerCompletedTasks: number
  taskerFirstTaskAt: Date | null
}

export interface FeeBreakdown {
  amountPaise: bigint
  posterFeePaise: bigint
  taskerFeePaise: bigint
  gstOnPosterFeePaise: bigint
  gstOnTaskerFeePaise: bigint
  taskerPayoutPaise: bigint
  totalChargedToPosterpaise: bigint
}

// Multiply amount by rate expressed as numerator/denominator, ceiling division
function applyRateCeil(amount: bigint, rateNumer: bigint, rateDenom: bigint): bigint {
  const product = amount * rateNumer
  const quotient = product / rateDenom
  const remainder = product % rateDenom
  return remainder > 0n ? quotient + 1n : quotient
}

export function calculateFees(input: FeeInput): FeeBreakdown {
  const { amountPaise, taskerCompletedTasks, taskerFirstTaskAt } = input

  if (amountPaise <= 0n) throw new Error('amountPaise must be positive')

  // Poster fee: 5% min ₹19
  const rawPosterFee = applyRateCeil(amountPaise, 5n, 100n)
  const posterFeePaise = rawPosterFee < BigInt(FEES.POSTER_MIN_PAISE)
    ? BigInt(FEES.POSTER_MIN_PAISE)
    : rawPosterFee

  // Tasker fee rate
  let taskerRateNumer = 10n
  let taskerRateDenom = 100n
  if (taskerFirstTaskAt) {
    const daysSinceFirst = (Date.now() - taskerFirstTaskAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceFirst <= FEES.TASKER_FREE_DAYS) {
      taskerRateNumer = 0n
    } else if (taskerCompletedTasks >= FEES.TASKER_VETERAN_THRESHOLD) {
      taskerRateNumer = 7n
    }
  }

  const taskerFeePaise = taskerRateNumer === 0n
    ? 0n
    : applyRateCeil(amountPaise, taskerRateNumer, taskerRateDenom)

  // GST at 18% on platform fees
  const gstOnPosterFeePaise = applyRateCeil(posterFeePaise, 18n, 100n)
  const gstOnTaskerFeePaise = applyRateCeil(taskerFeePaise, 18n, 100n)

  const taskerPayoutPaise = amountPaise - taskerFeePaise - gstOnTaskerFeePaise
  const totalChargedToPosterpaise = amountPaise + posterFeePaise + gstOnPosterFeePaise

  return {
    amountPaise,
    posterFeePaise,
    taskerFeePaise,
    gstOnPosterFeePaise,
    gstOnTaskerFeePaise,
    taskerPayoutPaise,
    totalChargedToPosterpaise,
  }
}

export const APP_NAME = 'Taim' as const
export const APP_NAME_LOGO = 'TAIM' as const
export const APP_TAGLINE = 'Taim nahi hai? Taim pe daal do.'
export const PRIMARY_DOMAIN = 'taim.space'
export const WEB_URL = `https://${PRIMARY_DOMAIN}`
export const ADMIN_URL = `https://admin.${PRIMARY_DOMAIN}`
export const DEFAULT_LOCALE = 'hi' as const
export const FALLBACK_LOCALE = 'en' as const
export const CURRENCY = 'INR' as const
export const TIMEZONE = 'Asia/Kolkata' as const

// Fee rates (multiply by 100 for paise from rupees)
export const FEES = {
  POSTER_RATE: 0.05,           // 5%
  POSTER_MIN_PAISE: 1900,      // ₹19 minimum
  TASKER_RATE_DEFAULT: 0.10,   // 10%
  TASKER_RATE_VETERAN: 0.07,   // 7% after 20 completed tasks
  TASKER_RATE_NEW: 0.00,       // 0% first 60 days
  TASKER_VETERAN_THRESHOLD: 20,
  TASKER_FREE_DAYS: 60,
  GST_RATE: 0.18,              // 18% on platform fees
} as const

export const WORK_ZONE_RADII_KM = [2, 5, 10, 15, 25] as const
export const MAX_WORK_ZONES = 3

export const TASK_SMART_REACH_HOURS = 2
export const BOOKING_AUTO_RELEASE_HOURS = 48

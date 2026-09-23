import { diffDays, fromKey, toKey, today } from './date'

/**
 * 회계연도(1/1) 기준 연차 발생 계산.
 *
 * - 입사 1년 미만: 매월 만근할 때마다 1일 ('월차'). 최대 11일이고 입사 1주년에 소멸한다
 * - 입사 다음 해 1/1: 전년도 재직 기간에 비례해 부여 (15일 × 재직일수 / 365)
 * - 그 다음 회계연도부터: 15일. 회계연도가 시작될 때 근속 3년 이상이면 2년마다 1일씩 가산 (최대 25일)
 *
 * 회사마다 비례분을 올리거나 버리는 방식이 달라 계산값은 참고용이고,
 * 내 정보에서 직접 고칠 수 있게 두었다.
 */

/** 법정 기본 연차 */
const BASE_DAYS = 15
/** 법정 상한 */
const MAX_DAYS = 25
/** 입사 1년 미만 월차 상한 */
const MAX_MONTHLY = 11

/** 'YYYY-MM-DD' 에 n개월 더하기. 말일이 없는 달이면 그 달의 마지막 날로 */
const addMonths = (key: string, n: number) => {
  const d = fromKey(key)
  const t = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const lastDay = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()
  t.setDate(Math.min(d.getDate(), lastDay))
  return toKey(t)
}

/** 입사일 기준 근속 연수 (소수점 없이 만 나이 세듯) */
const tenureYears = (joinDate: string, base: string) => {
  const j = fromKey(joinDate)
  const b = fromKey(base)
  let years = b.getFullYear() - j.getFullYear()
  if (b.getMonth() < j.getMonth() || (b.getMonth() === j.getMonth() && b.getDate() < j.getDate())) years -= 1
  return years
}

export interface Accrual {
  /** 회계연도에 부여된 연차 (첫 해는 비례분) */
  annual: number
  /** 입사 1년 미만 기간에 발생한 월차 */
  monthly: number
  total: number
  /** 다음 월차가 생기는 날 (아직 1년 미만일 때만) */
  nextMonthlyDate?: string
  /** 월차가 소멸하는 날 = 입사 1주년 */
  monthlyExpiresAt?: string
  /** 계산 근거 한 줄 */
  note: string
}

/** 입사 1주년 */
export const firstAnniversary = (joinDate: string) => addMonths(joinDate, 12)

/**
 * 입사 1년 미만 동안 지금까지 발생한 월차.
 * 입사일 + n개월 이 되는 날마다 1일씩, 최대 11일.
 */
export const monthlyAccrued = (joinDate: string, base = today()) => {
  let count = 0
  for (let n = 1; n <= MAX_MONTHLY; n++) {
    if (addMonths(joinDate, n) <= base) count += 1
    else break
  }
  return count
}

/** 다음 월차 발생일. 이미 1년이 지났거나 11일을 다 채웠으면 없다 */
export const nextMonthlyDate = (joinDate: string, base = today()) => {
  for (let n = 1; n <= MAX_MONTHLY; n++) {
    const d = addMonths(joinDate, n)
    if (d > base) return d
  }
  return undefined
}

/** 해당 회계연도에 부여되는 연차 (월차 제외) */
const annualGrant = (joinDate: string, year: number) => {
  const joinYear = Number(joinDate.slice(0, 4))
  // 입사한 해에는 회계연도 부여가 없고 월차만 쌓인다
  if (year <= joinYear) return 0

  // 입사 다음 해 1/1 — 전년도 재직 기간에 비례
  if (year === joinYear + 1) {
    const worked = diffDays(joinDate, `${joinYear}-12-31`) + 1
    return Math.round(((BASE_DAYS * worked) / 365) * 10) / 10
  }

  // 그 다음부터는 15일 + 가산 (회계연도가 시작될 때의 근속 기준)
  const tenure = tenureYears(joinDate, `${year}-01-01`)
  const bonus = tenure >= 3 ? Math.floor((tenure - 1) / 2) : 0
  return Math.min(MAX_DAYS, BASE_DAYS + bonus)
}

/** 해당 회계연도에 쓸 수 있는 연차를 계산한다 */
export const accrualFor = (joinDate: string, year: number, base = today()): Accrual | null => {
  if (!joinDate) return null
  const yearEnd = `${year}-12-31`
  if (joinDate > yearEnd) return null // 아직 입사 전

  const annual = annualGrant(joinDate, year)

  // 이 해에 발생한 월차 — 입사 1년 미만 기간만, 오늘까지 생긴 것만
  const until = base < yearEnd ? base : yearEnd
  let monthly = 0
  for (let n = 1; n <= MAX_MONTHLY; n++) {
    const d = addMonths(joinDate, n)
    if (d > until) break
    if (d.slice(0, 4) === String(year)) monthly += 1
  }

  const anniversary = firstAnniversary(joinDate)
  const inFirstYear = base < anniversary
  const next = inFirstYear ? nextMonthlyDate(joinDate, base) : undefined

  const parts: string[] = []
  if (annual > 0) parts.push(year === Number(joinDate.slice(0, 4)) + 1 ? `비례 연차 ${annual}일` : `연차 ${annual}일`)
  if (monthly > 0) parts.push(`월차 ${monthly}일`)

  return {
    annual,
    monthly,
    total: Math.round((annual + monthly) * 100) / 100,
    nextMonthlyDate: next,
    monthlyExpiresAt: inFirstYear ? anniversary : undefined,
    note: parts.join(' + ') || '아직 발생한 연차가 없어요',
  }
}

/** 1년 미만이라 연차가 매달 늘어나는 중인지 */
export const isAccruing = (joinDate: string, base = today()) =>
  Boolean(joinDate) && base < firstAnniversary(joinDate) && Boolean(nextMonthlyDate(joinDate, base))

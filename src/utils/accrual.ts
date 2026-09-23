import { diffDays, fromKey, toKey, today } from './date'

/**
 * 회계연도(1/1) 기준 연차 발생 계산.
 *
 * - 입사 1년 미만: 매월 만근할 때마다 1일 ('월차'). 최대 11일이고 입사 1주년에 소멸한다
 * - 입사 다음 해 1/1: 전년도 재직 기간에 비례해 부여 (15일 × 재직일수 / 365, 올림)
 * - 그 다음 회계연도부터: 15일. 회계연도가 시작될 때 근속 3년 이상이면 2년마다 1일씩 가산 (최대 25일)
 *
 * 비례분은 근로자에게 불리하지 않게 올리는 곳이 많아 올림으로 두었다.
 * 회사마다 다를 수 있어 계산값은 참고용이고, 내 정보에서 직접 고칠 수 있다.
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
    // 윤년(366일)이면 비율이 1을 넘으므로 기본 일수로 막는다
    return Math.min(BASE_DAYS, Math.ceil((BASE_DAYS * worked) / 365))
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

export interface NextRaise {
  /** 늘어나는 회계연도 */
  year: number
  /** 그때 받는 일수 */
  days: number
  /** 지금 받는 일수 */
  from: number
  reason: string
}

/**
 * 다음에 연차가 늘어나는 시점.
 * 회계연도 기준이라 근속 3년을 넘겨도 가산은 그 다음 1/1 에 반영된다.
 * 이미 상한(25일)이면 없다.
 */
export const nextRaise = (joinDate: string, year: number): NextRaise | null => {
  if (!joinDate) return null
  const from = annualGrant(joinDate, year)
  for (let y = year + 1; y <= year + 30; y++) {
    const days = annualGrant(joinDate, y)
    if (days <= from) continue
    const reason =
      from === 0
        ? '전년도 재직 기간에 비례한 첫 연차'
        : days >= BASE_DAYS && from < BASE_DAYS
          ? '비례분이 끝나고 온전히 받는 첫 해'
          : `근속 ${tenureYears(joinDate, `${y}-01-01`)}년 가산`
    return { year: y, days, from, reason }
  }
  return null
}

/** 근속 n년차에 부여되는 연차. 3년 이상부터 2년마다 1일씩 가산 */
const daysForYear = (n: number) => Math.min(MAX_DAYS, BASE_DAYS + (n >= 3 ? Math.floor((n - 1) / 2) : 0))

export interface Settlement {
  /** 입사일 기준으로 다시 계산한 발생 연차 (퇴사 정산 기준) */
  legal: { monthly: number; annual: number; total: number; grants: { date: string; days: number }[] }
  /** 회계연도 기준으로 실제 부여받은 연차 */
  fiscal: { monthly: number; annual: number; total: number; grants: { year: number; days: number }[] }
  /** 입사일 기준 − 회계연도 기준. 양수면 덜 받은 것, 음수면 더 받은 것 */
  diff: number
}

/**
 * 퇴사할 때의 연차 재정산.
 * 회계연도 기준으로 받아 온 연차와, 입사일 기준으로 다시 계산한 연차를 견줘 차이를 낸다.
 */
export const settlementFor = (joinDate: string, leaveDate: string): Settlement | null => {
  if (!joinDate || !leaveDate || leaveDate < joinDate) return null

  // 입사일 기준 — 1년 미만 월차 + 매 주년마다 부여
  const monthly = monthlyAccrued(joinDate, leaveDate)
  const grants: { date: string; days: number }[] = []
  for (let n = 1; ; n++) {
    const d = addMonths(joinDate, 12 * n)
    if (d > leaveDate) break
    grants.push({ date: d, days: daysForYear(n) })
  }
  const legalAnnual = grants.reduce((s, g) => s + g.days, 0)

  // 회계연도 기준 — 입사한 해부터 퇴사한 해까지 1/1 에 부여된 것
  const fiscalGrants: { year: number; days: number }[] = []
  for (let y = Number(joinDate.slice(0, 4)); y <= Number(leaveDate.slice(0, 4)); y++) {
    const days = annualGrant(joinDate, y)
    if (days > 0) fiscalGrants.push({ year: y, days })
  }
  const fiscalAnnual = fiscalGrants.reduce((s, g) => s + g.days, 0)

  const round = (n: number) => Math.round(n * 100) / 100
  return {
    legal: { monthly, annual: legalAnnual, total: round(monthly + legalAnnual), grants },
    fiscal: { monthly, annual: fiscalAnnual, total: round(monthly + fiscalAnnual), grants: fiscalGrants },
    diff: round(legalAnnual - fiscalAnnual),
  }
}

/** 1년 미만이라 연차가 매달 늘어나는 중인지 */
export const isAccruing = (joinDate: string, base = today()) =>
  Boolean(joinDate) && base < firstAnniversary(joinDate) && Boolean(nextMonthlyDate(joinDate, base))

import type { CalendarEvent, Leave } from '@/types'
import { HOLIDAY_MAP } from '@/data/holidays'
import { FAMILY_EVENT_MAP } from '@/data/familyEvents'
import { PAYOUT_LIMIT } from '@/data/leaveRules'
import { addDays, buildDayOffContext, countWorkingDays, diffDays, isDayOff, isWorkingDay, today, type DayOffContext } from './date'

export interface LeaveSummary {
  total: number
  used: number
  planned: number
  remaining: number
  usageRate: number
  /** 경조휴가로 쉰(쉴) 날 수. 연차와 별개라 잔여에는 영향 없다 */
  familyDays: number
}

/** 오늘 기준으로 사용/예정/잔여 연차 계산 */
export const summarizeLeaves = (leaves: Leave[], total: number, base = today()): LeaveSummary => {
  const used = leaves.filter((l) => l.startDate <= base).reduce((s, l) => s + l.amount, 0)
  const planned = leaves.filter((l) => l.startDate > base).reduce((s, l) => s + l.amount, 0)
  const remaining = total - used - planned
  const familyDays = leaves.filter((l) => l.type === '경조').reduce((s, l) => s + diffDays(l.startDate, l.endDate) + 1, 0)
  return { total, used, planned, remaining, usageRate: total === 0 ? 0 : Math.round((used / total) * 100), familyDays }
}

/**
 * 연말까지 남은 연차를 안 쓰면 어떻게 되는지.
 * 정해진 일수까지만 수당으로 받고 나머지는 소멸한다.
 */
export const yearEndOutcome = (remaining: number) => {
  const left = Math.max(0, remaining)
  const payout = Math.min(PAYOUT_LIMIT, left)
  return { payout, expire: Math.round((left - payout) * 100) / 100, limit: PAYOUT_LIMIT }
}

/** 연말이 다가올수록 경고를 세게 한다 */
export type ExpiryLevel = 'info' | 'warn' | 'urgent'

/**
 * 연말까지 남은 연차가 어떻게 되는지 미리 알려주기 위한 값.
 * 소멸될 연차가 있고 연말이 100일 안쪽일 때만 보여준다 (대략 4분기부터).
 */
export const yearEndOutlook = (remaining: number, ctx: DayOffContext, base = today()) => {
  const end = `${base.slice(0, 4)}-12-31`
  const daysLeft = diffDays(base, end)
  const { payout, expire, limit } = yearEndOutcome(remaining)
  const workingDaysLeft = countWorkingDays(base, end, ctx)
  const level: ExpiryLevel = daysLeft <= 30 ? 'urgent' : daysLeft <= 60 ? 'warn' : 'info'
  return {
    show: expire > 0 && daysLeft >= 0 && daysLeft <= 100,
    payout,
    expire,
    limit,
    daysLeft,
    workingDaysLeft,
    level,
    end,
    /** 남은 근무일보다 써야 할 연차가 많으면 다 쓰는 게 불가능하다 */
    tooLate: remaining > workingDaysLeft,
  }
}

/** 목록·달력에 보여줄 이름. 경조휴가는 사유를, 나머지는 유형을 */
export const leaveLabel = (l: Pick<Leave, 'type' | 'eventKey'>) =>
  l.type === '경조' ? (l.eventKey && FAMILY_EVENT_MAP.get(l.eventKey)?.label) || '경조휴가' : l.type

export interface Recommendation {
  /** 사용할 연차 날짜들 */
  dates: string[]
  restStart: string
  restEnd: string
  restDays: number
  useDays: number
  reason: string
}

export interface RecommendOptions {
  /** 사용할 연차 일수. 'max'는 잔여 연차 내에서 가장 긴 휴식 */
  useDays: number | 'max'
  exclude?: { from: string; to: string }
  remaining: number
  from?: string
  to?: string
}

const describe = (dates: string[], restStart: string, restEnd: string): string => {
  const names = new Set<string>()
  let cur = restStart
  while (cur <= restEnd) {
    const h = HOLIDAY_MAP.get(cur)
    if (h) names.add(h.replace(/ 연휴|대체공휴일\(|\)/g, ''))
    cur = addDays(cur, 1)
  }
  const base = names.size ? `${[...names].join('·')} 연휴와 연결` : '주말과 연결되는 연차'
  return dates.length === 1 ? base : `연차 ${dates.length}일 사용 · ${base}`
}

/** 특정 날짜들을 연차로 쓴다고 가정했을 때 앞뒤로 이어지는 휴식 구간 */
const restBlock = (dates: string[], ctx: DayOffContext) => {
  const extra = new Set(dates)
  let start = dates[0]
  while (isDayOff(addDays(start, -1), ctx, extra)) start = addDays(start, -1)
  let end = dates[dates.length - 1]
  while (isDayOff(addDays(end, 1), ctx, extra)) end = addDays(end, 1)
  return { start, end }
}

export const recommendLeaves = (leaves: Leave[], events: CalendarEvent[], opts: RecommendOptions): Recommendation[] => {
  const ctx = buildDayOffContext(leaves, events)
  const from = opts.from ?? addDays(today(), 1)
  const to = opts.to ?? `${today().slice(0, 4)}-12-31`
  const maxUse = Math.min(5, Math.floor(opts.remaining))
  if (maxUse < 1) return []

  const useCandidates =
    opts.useDays === 'max' ? Array.from({ length: maxUse }, (_, i) => i + 1) : [Math.min(opts.useDays, maxUse)]

  const excluded = (d: string) => (opts.exclude ? d >= opts.exclude.from && d <= opts.exclude.to : false)

  // 후보 근무일 (이미 연차인 날 제외)
  const workingDays: string[] = []
  let cur = from
  while (cur <= to) {
    if (isWorkingDay(cur, ctx) && !ctx.leaveMap.has(cur) && !excluded(cur)) workingDays.push(cur)
    cur = addDays(cur, 1)
  }

  const results: Recommendation[] = []
  const seen = new Set<string>()

  for (const n of useCandidates) {
    for (let i = 0; i + n <= workingDays.length; i++) {
      const dates = workingDays.slice(i, i + n)

      // 후보 날짜 사이에 출근일이 끼어 있으면 연속 휴식이 아님
      let contiguous = true
      for (let k = 1; k < dates.length && contiguous; k++) {
        for (let d = addDays(dates[k - 1], 1); d < dates[k]; d = addDays(d, 1)) {
          if (isWorkingDay(d, ctx) && !ctx.leaveMap.has(d)) {
            contiguous = false
            break
          }
        }
      }
      if (!contiguous) continue

      const { start, end } = restBlock(dates, ctx)
      const restDays = diffDays(start, end) + 1
      // 휴일과 이어지지 않으면 추천 의미 없음
      if (restDays <= n + 1) continue

      const key = `${start}~${end}`
      if (seen.has(key)) continue
      seen.add(key)
      results.push({ dates, restStart: start, restEnd: end, restDays, useDays: n, reason: describe(dates, start, end) })
    }
  }

  // 효율(휴식일/연차) → 휴식 길이 → 빠른 날짜 순
  return results
    .sort(
      (a, b) =>
        b.restDays / b.useDays - a.restDays / a.useDays ||
        b.restDays - a.restDays ||
        a.dates[0].localeCompare(b.dates[0]),
    )
    .slice(0, 10)
}

import { HOLIDAY_MAP } from '@/data/holidays'
import type { CalendarEvent, Leave } from '@/types'

const pad = (n: number) => String(n).padStart(2, '0')

/** Date → 'YYYY-MM-DD' (로컬 기준) */
export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** 'YYYY-MM-DD' → Date (로컬 자정) */
export const fromKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const today = () => toKey(new Date())

export const addDays = (key: string, n: number) => {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

export const diffDays = (from: string, to: string) =>
  Math.round((fromKey(to).getTime() - fromKey(from).getTime()) / 86_400_000)

export const isWeekend = (key: string) => {
  const day = fromKey(key).getDay()
  return day === 0 || day === 6
}

export const isHoliday = (key: string) => HOLIDAY_MAP.has(key)

export const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']
export const weekdayKo = (key: string) => WEEKDAY_KO[fromKey(key).getDay()]

/** 'MM.DD' */
export const fmtShort = (key: string) => key.slice(5).replace('-', '.')
/** 'YYYY.MM.DD' */
export const fmtFull = (key: string) => key.replaceAll('-', '.')
/** 'M월 D일 (요일)' */
export const fmtKo = (key: string) => {
  const d = fromKey(key)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdayKo(key)})`
}

/** 입사일 기준 근속기간 텍스트. 입사일이 없으면 빈 문자열 */
export const tenureText = (joinDate: string, base = today()) => {
  if (!joinDate) return ''
  const j = fromKey(joinDate)
  const t = fromKey(base)
  let years = t.getFullYear() - j.getFullYear()
  let months = t.getMonth() - j.getMonth()
  if (t.getDate() < j.getDate()) months -= 1
  if (months < 0) {
    years -= 1
    months += 12
  }
  const parts = []
  if (years > 0) parts.push(`${years}년`)
  parts.push(`${months}개월`)
  return parts.join(' ')
}

/** 연차를 하루 단위로 펼친 뒤 Map<date, Leave> */
export const expandLeaves = (leaves: Leave[]) => {
  const map = new Map<string, Leave>()
  for (const l of leaves) {
    let cur = l.startDate
    while (cur <= l.endDate) {
      map.set(cur, l)
      cur = addDays(cur, 1)
    }
  }
  return map
}

export interface DayOffContext {
  leaveMap: Map<string, Leave>
  companyOff: Set<string>
}

export const buildDayOffContext = (leaves: Leave[], events: CalendarEvent[]): DayOffContext => ({
  leaveMap: expandLeaves(leaves),
  companyOff: new Set(events.filter((e) => e.type === 'company' && e.dayOff).map((e) => e.date)),
})

/** 출근하지 않는 날인지 (주말·공휴일·회사휴무·연차) */
export const isDayOff = (key: string, ctx: DayOffContext, extra?: Set<string>) =>
  isWeekend(key) ||
  isHoliday(key) ||
  ctx.companyOff.has(key) ||
  ctx.leaveMap.has(key) ||
  (extra?.has(key) ?? false)

/** 근무일인지 (주말·공휴일·회사휴무 제외, 연차는 고려 안 함) */
export const isWorkingDay = (key: string, ctx: DayOffContext) =>
  !isWeekend(key) && !isHoliday(key) && !ctx.companyOff.has(key)

/** 기간 내 근무일 수 */
export const countWorkingDays = (start: string, end: string, ctx: DayOffContext) => {
  let n = 0
  let cur = start
  while (cur <= end) {
    if (isWorkingDay(cur, ctx)) n += 1
    cur = addDays(cur, 1)
  }
  return n
}

/** 해당 월의 달력 셀 (월요일 시작, 6주 고정) */
export const monthGrid = (year: number, month: number) => {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7 // 월=0
  const start = new Date(year, month, 1 - offset)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return { key: toKey(d), inMonth: d.getMonth() === month }
  })
}

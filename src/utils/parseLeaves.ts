import type { LeaveType } from '@/types'

/**
 * 근태 시스템의 연차 사용내역을 붙여넣어 연차 목록으로 만든다.
 *
 * 1) 표 형식(U+웍스 연차 사용내역)을 먼저 시도한다.
 *    신청일 / 구분 / 유형 / 처리 / 증감 / 사용기간 / 사유
 *    2026-09-18  연차  연차   사용  -1     2026-10-02 ~ 2026-10-02  개인사유
 *    2026-01-02  연차        추가  +15    2026-12-31               관리자
 *    → '사용'만 연차로 가져오고, '추가/차감'은 부여 일수로 따로 집계한다.
 *      '삭제/취소'는 같은 날짜의 사용 건을 취소 처리한다.
 *      날짜는 반드시 신청일이 아니라 '사용기간'을 쓴다.
 *
 * 2) 표로 인식되지 않으면 한 줄에서 날짜·유형·일수를 찾아내는 느슨한 방식으로 처리한다.
 */

export interface ParsedLeave {
  key: string
  startDate: string
  endDate: string
  type: LeaveType
  /** 텍스트에 일수가 적혀 있던 경우만. 없으면 유형·기간으로 계산한다 */
  amount?: number
  memo?: string
  /** 나중에 취소(삭제)된 건 */
  cancelled?: boolean
}

export interface ParseResult {
  rows: ParsedLeave[]
  /** 날짜를 찾지 못해 건너뛴 줄 */
  skipped: string[]
  /** 표 형식으로 인식됐는지 */
  structured: boolean
  /** '추가/차감' 행의 합계 — 총 연차 참고값 */
  grant: { total: number; count: number }
}

const pad = (n: number) => String(n).padStart(2, '0')

const FULL_DATE = /(\d{4})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})\s*일?/g
const SHORT_DATE = /(?<!\d)(\d{1,2})\s*[-./월]\s*(\d{1,2})\s*일?(?!\d)/g

const TYPE_PATTERNS: { re: RegExp; type: LeaveType }[] = [
  { re: /반반차|1\/4\s*연차/, type: '반반차' },
  { re: /반차|반일|오전\s*휴가|오후\s*휴가/, type: '반차' },
  { re: /연차|월차|종일\s*휴가|휴가/, type: '연차' },
  { re: /경조/, type: '경조' },
  { re: /공가|병가|대체\s*휴무|보상\s*휴가|기타/, type: '기타' },
]

/** 유형이 명시되지 않았을 때 쓰는 기본 차감 일수 */
export const DEFAULT_AMOUNT: Record<LeaveType, number> = {
  연차: 1,
  반차: 0.5,
  반반차: 0.25,
  경조: 0,
  기타: 1,
}

const NOISE_TOKENS = new Set([
  '연차', '월차', '반차', '반반차', '오전반차', '오후반차', '오전', '오후', '반일',
  '휴가', '종일휴가', '공가', '병가', '경조', '경조휴가', '대체휴무', '보상휴가', '기타',
  '승인', '완료', '대기', '반려', '신청', '사용', '취소',
])

const HEADER_WORDS = /신청|구분|유형|종류|기간|일자|날짜|사용일|일수|차감|상태|결재|비고|합계|사원|이름|증감|잔여|처리/

/**
 * 전자결재 문서함 목록인지 추정한다.
 * 그 목록의 날짜는 기안일·완료일(결재 날짜)이라 실제 휴가 날짜가 아니다.
 */
export function looksLikeApprovalDocList(text: string) {
  if (/기안일|완료일|문서번호|양식명|결재선/.test(text)) return true
  const docTitleLines = text.split(/\r?\n/).filter((l) => /신청서|결의서|품의서/.test(l)).length
  return docTitleLines >= 3
}

const toKey = (y: string, m: string, d: string) => `${y}-${pad(Number(m))}-${pad(Number(d))}`

const cellsOf = (line: string) =>
  line
    .split(/\t| {2,}/)
    .map((c) => c.trim())
    .filter(Boolean)

const ACTION = /^(사용|추가|차감|삭제|취소|반납|복원)$/
const SIGNED = /^[+-]?\d+(?:\.\d+)?$/
const EXACT_TYPE: Record<string, LeaveType> = {
  연차: '연차',
  월차: '연차',
  반차: '반차',
  오전반차: '반차',
  오후반차: '반차',
  반반차: '반반차',
  공가: '기타',
  병가: '기타',
  경조: '경조',
  경조휴가: '경조',
}

interface StructuredRow {
  action: string
  amount: number
  start?: string
  end?: string
  type: LeaveType
  memo?: string
}

/** 표 한 줄을 해석한다. 표 형식이 아니면 null */
function parseStructuredLine(line: string): StructuredRow | null {
  const cells = cellsOf(line)
  const actionIdx = cells.findIndex((c) => ACTION.test(c))
  if (actionIdx === -1) return null

  const amountCell = cells.slice(actionIdx + 1).find((c) => SIGNED.test(c))
  if (amountCell === undefined) return null
  const amount = Math.abs(Number(amountCell))

  // 사용기간: 'YYYY-MM-DD ~ YYYY-MM-DD'
  let start: string | undefined
  let end: string | undefined
  let rangeIdx = -1
  cells.forEach((c, i) => {
    if (start) return
    const m = c.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})\s*~\s*(\d{4})[-./](\d{1,2})[-./](\d{1,2})/)
    if (m && i > actionIdx) {
      start = toKey(m[1], m[2], m[3])
      end = toKey(m[4], m[5], m[6])
      rangeIdx = i
    }
  })

  // 유형은 처리 컬럼 바로 앞
  const type = EXACT_TYPE[cells[actionIdx - 1]] ?? '연차'

  const memo =
    rangeIdx === -1
      ? undefined
      : cells
          .slice(rangeIdx + 1)
          .filter((c) => c && !/^\d{4}[-./]\d{1,2}[-./]\d{1,2}$/.test(c))
          .join(' ') || undefined

  return { action: cells[actionIdx], amount, start, end, type, memo }
}

/** 느슨한 방식: 한 줄에서 날짜·유형·일수를 찾는다 */
function parseLooseLine(line: string, defaultYear: number, index: number): ParsedLeave | null {
  const cleaned = line.replace(/\(\s*[월화수목금토일]\s*\)|[월화수목금토일]요일/g, ' ')

  const dates: string[] = []
  let rest = cleaned

  for (const m of cleaned.matchAll(FULL_DATE)) {
    dates.push(toKey(m[1], m[2], m[3]))
    rest = rest.replace(m[0], ' ')
  }
  if (dates.length === 0) {
    for (const m of cleaned.matchAll(SHORT_DATE)) {
      const mm = Number(m[1])
      const dd = Number(m[2])
      if (mm < 1 || mm > 12 || dd < 1 || dd > 31) continue
      dates.push(`${defaultYear}-${pad(mm)}-${pad(dd)}`)
      rest = rest.replace(m[0], ' ')
    }
  }
  if (dates.length === 0) return null

  const sorted = [...dates].sort()
  const type = TYPE_PATTERNS.find((p) => p.re.test(rest))?.type ?? '연차'

  let amount: number | undefined
  const withUnit = rest.match(/(-?\d+(?:\.\d+)?)\s*일/)
  const bare = rest.match(/(?:^|[\s|,\t])(-?\d+(?:\.\d+)?)(?=$|[\s|,\t])/)
  const raw = withUnit?.[1] ?? bare?.[1]
  if (raw !== undefined) {
    const n = Math.abs(Number(raw))
    if (Number.isFinite(n) && n > 0 && n <= 30) {
      amount = n
      rest = rest.replace(withUnit?.[0] ?? bare![0], ' ')
    }
  }

  const memo = rest
    .split(/[\s|,\t]+/)
    .map((t) => t.replace(/[-–~:()]/g, '').trim())
    .filter((t) => t && !NOISE_TOKENS.has(t))
    .join(' ')

  return {
    key: `${sorted[0]}-${index}`,
    startDate: sorted[0],
    endDate: sorted[sorted.length - 1],
    type,
    amount,
    memo: memo || undefined,
  }
}

export function parseLeaves(text: string, defaultYear: number): ParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const rows: ParsedLeave[] = []
  const skipped: string[] = []
  const grant = { total: 0, count: 0 }
  /** 취소(삭제)된 사용 건 — '시작|종료|일수' */
  const cancelled = new Set<string>()
  let structured = false

  lines.forEach((line, i) => {
    const s = parseStructuredLine(line)

    if (s) {
      structured = true
      if (s.action === '추가' || s.action === '복원') {
        grant.total += s.amount
        grant.count += 1
        return
      }
      if (s.action === '차감' || s.action === '반납') {
        grant.total -= s.amount
        grant.count += 1
        return
      }
      if (s.action === '삭제' || s.action === '취소') {
        if (s.start && s.end) cancelled.add(`${s.start}|${s.end}|${s.amount}`)
        return
      }
      // 사용
      if (!s.start || !s.end) {
        skipped.push(line)
        return
      }
      rows.push({
        key: `${s.start}-${i}`,
        startDate: s.start,
        endDate: s.end,
        type: s.type,
        amount: s.amount,
        memo: s.memo,
      })
      return
    }

    const loose = parseLooseLine(line, defaultYear, i)
    if (loose) rows.push(loose)
    else if (!HEADER_WORDS.test(line)) skipped.push(line)
  })

  // 취소된 건 표시
  for (const r of rows) {
    if (cancelled.has(`${r.startDate}|${r.endDate}|${r.amount}`)) r.cancelled = true
  }

  return { rows, skipped, structured, grant }
}

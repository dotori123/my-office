import { BENEFIT_CATEGORIES, type BenefitCategory } from '@/types'

/**
 * 카드 사용내역·지출결의서 목록 등에서 복사한 표 텍스트를 지원비 사용 내역으로 파싱한다.
 * 한 줄에서 "날짜 / 금액 / 항목"을 찾아내는 방식이라 시스템마다 다른 형식도 웬만하면 받아들인다.
 *
 * 받아들이는 예
 *   2026-09-02	IntelliJ	149,000	소프트웨어
 *   2026.09.10	교육비	42,000원	교육	UX 라이팅 워크숍
 *   09/15	타입스크립트 프로그래밍	19,000
 */

export interface ParsedBenefit {
  key: string
  date: string
  name: string
  amount: number
  category: BenefitCategory
  memo?: string
}

export interface BenefitParseResult {
  rows: ParsedBenefit[]
  skipped: string[]
}

const pad = (n: number) => String(n).padStart(2, '0')

const FULL_DATE = /(\d{4})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})\s*일?/
const SHORT_DATE = /(?<!\d)(\d{1,2})\s*[-./월]\s*(\d{1,2})\s*일?(?!\d)/

/** 카테고리 추정 키워드 */
const CATEGORY_PATTERNS: { re: RegExp; category: BenefitCategory }[] = [
  { re: /도서|책|서적|북스|교보|알라딘|yes24|예스24/i, category: '도서' },
  { re: /교육|강의|강좌|수강|세미나|컨퍼런스|워크숍|워크샵|인프런|패스트캠퍼스|클래스/i, category: '교육' },
  { re: /소프트웨어|라이선스|라이센스|구독|sw|jetbrains|intellij|figma|adobe|notion|github|chatgpt/i, category: '소프트웨어' },
]

/** 금액이 아닌 것이 확실한 토큰 */
const NOISE_TOKENS = new Set([
  '승인', '완료', '대기', '반려', '신청', '사용', '취소', '지급', '정산',
  '지출결의서', '영수증', '영수증첨부', '첨부', '카드', '법인카드', '개인카드', '현금', '계좌이체', '원',
])

const HEADER_WORDS = /사용일|사용처|금액|항목|구분|분류|내역|비고|합계|잔액|승인일|거래|가맹점|적요/

const cellsOf = (line: string) =>
  line
    .split(/\t| {2,}/)
    // '개인카드 /' 처럼 뒤에 붙은 구분자를 떼어낸다
    .map((c) => c.replace(/\s*[/|]\s*$/, '').trim())
    .filter(Boolean)

/** 날짜 하나만 있는 줄 */
const DATE_ONLY = /^\d{4}\s*[-./년]\s*\d{1,2}\s*[-./월]\s*\d{1,2}\s*일?$/

/**
 * 한 건이 여러 줄에 세로로 나열된 형식을 한 줄로 합친다.
 *
 *   2026-04-06
 *   Claude Pro 1개월 구독
 *   33,493
 *   개인카드 /
 *   영수증첨부
 *
 * 날짜만 있는 줄이 두 개 이상이면 이 형식으로 보고, 다음 날짜 전까지를 한 건으로 묶는다.
 */
function joinVerticalBlocks(lines: string[]) {
  if (lines.filter((l) => DATE_ONLY.test(l)).length < 2) return lines

  const out: string[] = []
  let current: string[] | null = null
  for (const line of lines) {
    if (DATE_ONLY.test(line)) {
      if (current) out.push(current.join('\t'))
      current = [line]
    } else if (current) {
      current.push(line)
    } else {
      out.push(line) // 첫 날짜 앞의 머리말은 그대로 둔다
    }
  }
  if (current) out.push(current.join('\t'))
  return out
}

/** '149,000' '149000원' '-42,000' 같은 금액 후보 */
const moneyIn = (text: string): number | null => {
  const found: number[] = []
  for (const m of text.matchAll(/(-?\d{1,3}(?:,\d{3})+|-?\d+)\s*원?/g)) {
    const n = Math.abs(Number(m[1].replace(/,/g, '')))
    // 수량(1, 2)이나 순번이 금액으로 잡히지 않도록 하한을 둔다
    if (Number.isFinite(n) && n >= 100 && n <= 100_000_000) found.push(n)
  }
  return found.length ? Math.max(...found) : null
}

export function parseBenefits(text: string, defaultYear: number): BenefitParseResult {
  const rows: ParsedBenefit[] = []
  const skipped: string[] = []

  joinVerticalBlocks(
    text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean),
  ).forEach((line, i) => {
      const cleaned = line.replace(/\(\s*[월화수목금토일]\s*\)|[월화수목금토일]요일/g, ' ')
      const cells = cellsOf(cleaned)

      // 날짜
      let date = ''
      let dateIdx = -1
      cells.forEach((c, idx) => {
        if (date) return
        const full = c.match(FULL_DATE)
        if (full) {
          date = `${full[1]}-${pad(Number(full[2]))}-${pad(Number(full[3]))}`
          dateIdx = idx
          return
        }
        const short = c.match(SHORT_DATE)
        if (short) {
          const mm = Number(short[1])
          const dd = Number(short[2])
          if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
            date = `${defaultYear}-${pad(mm)}-${pad(dd)}`
            dateIdx = idx
          }
        }
      })
      if (!date) {
        if (!HEADER_WORDS.test(line)) skipped.push(line)
        return
      }

      // 금액 — 날짜 칸을 뺀 나머지에서 가장 큰 값
      const rest = cells.filter((_, idx) => idx !== dateIdx)
      let amount: number | null = null
      let amountIdx = -1
      rest.forEach((c, idx) => {
        const n = moneyIn(c)
        if (n !== null && (amount === null || n > amount)) {
          amount = n
          amountIdx = idx
        }
      })
      if (amount === null) {
        skipped.push(line)
        return
      }

      // 카테고리 — 정확히 일치하는 칸이 있으면 그걸 쓰고, 없으면 줄 전체에서 추정
      let category: BenefitCategory = '기타'
      let categoryIdx = -1
      rest.forEach((c, idx) => {
        if (categoryIdx !== -1) return
        if ((BENEFIT_CATEGORIES as readonly string[]).includes(c)) {
          category = c as BenefitCategory
          categoryIdx = idx
        }
      })
      if (categoryIdx === -1) {
        category = CATEGORY_PATTERNS.find((p) => p.re.test(line))?.category ?? '기타'
      }

      // 남은 칸에서 항목명과 메모
      const words = rest.filter(
        (c, idx) =>
          idx !== amountIdx &&
          idx !== categoryIdx &&
          !NOISE_TOKENS.has(c) &&
          !/^-?[\d,]+원?$/.test(c) && // 남은 금액 칸
          !/^\d+\s*(개|건|매|장|권|회|ea)$/i.test(c), // 수량 칸
      )

      rows.push({
        key: `${date}-${i}`,
        date,
        name: words[0] ?? category,
        amount,
        category,
        memo: words.slice(1).join(' ') || undefined,
      })
    })

  return { rows, skipped }
}

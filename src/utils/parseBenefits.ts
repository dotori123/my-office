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
  /** 지출결의서의 결재일. 여러 건을 합칠 때 기준 날짜로 쓴다 */
  approvalDate?: string
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

/** 이 줄부터는 꼬리말 — 합계·계좌 정보가 본문으로 섞이지 않게 잘라낸다 */
const FOOTER = /^합\s*계|지급\s*계좌|계좌\s*번호|예금주|은행명/
/** 라벨만 있는 줄 — 조용히 버린다 */
const LABEL_ONLY = /^(성\s*명|부\s*서|직\s*위|결\s*재\s*일|지출금액|제\s*목|내\s*역|지출일자|지출내역|금\s*액|비\s*고|일금|원정)/
/** 결재일 라벨 */
const APPROVAL_LABEL = /결\s*재\s*일|결의\s*일|승인\s*일/

/** 공백이 섞여 있어도 'YYYY년 M월 D일' 하나만 있는 줄이면 날짜로 읽는다 */
const dateOfLine = (line: string) => {
  const m = line.match(/^\s*(\d{4})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})\s*일?\s*$/)
  return m ? `${m[1]}-${pad(Number(m[2]))}-${pad(Number(m[3]))}` : null
}

/**
 * 지출결의서 양식에서 머리말·꼬리말을 걷어내고 결재일을 찾는다.
 * 이 과정을 거치지 않으면 '합계' 금액이 마지막 건의 금액으로 잡히고,
 * 계좌번호·예금주 같은 정보가 메모로 딸려 들어간다.
 */
function stripForm(lines: string[]) {
  const stop = lines.findIndex((l) => FOOTER.test(l))
  const body = stop === -1 ? lines : lines.slice(0, stop)

  let approvalDate: string | undefined
  const out: string[] = []

  for (let i = 0; i < body.length; i++) {
    const line = body[i]

    if (APPROVAL_LABEL.test(line)) {
      // 라벨과 날짜가 같은 줄에 있을 수도, 다음 줄에 있을 수도 있다
      const here = dateOfLine(line.replace(APPROVAL_LABEL, ''))
      const next = body[i + 1] ? dateOfLine(body[i + 1]) : null
      if (here) approvalDate = here
      else if (next) {
        approvalDate = next
        i += 1
      }
      continue
    }

    if (LABEL_ONLY.test(line)) continue
    out.push(line)
  }

  // 결재일이 있으면 지출결의서 양식으로 보고, 첫 지출일자 앞의 머리말(성명·부서 등)은 버린다
  if (approvalDate) {
    const first = out.findIndex((l) => DATE_ONLY.test(l))
    if (first > 0) return { body: out.slice(first), approvalDate }
  }

  return { body: out, approvalDate }
}

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
 * 한 건만 붙여넣어 날짜 줄이 하나뿐이면, 나머지 줄에 날짜가 없을 때만 이 형식으로 본다
 * (표 위에 날짜 제목 하나가 있는 경우와 구분하기 위해).
 */
function joinVerticalBlocks(lines: string[]) {
  const dateOnlyCount = lines.filter((l) => DATE_ONLY.test(l)).length
  if (dateOnlyCount === 0) return lines
  if (dateOnlyCount === 1 && lines.some((l) => !DATE_ONLY.test(l) && FULL_DATE.test(l))) return lines

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

  const { body, approvalDate } = stripForm(
    text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean),
  )

  joinVerticalBlocks(body).forEach((line, i) => {
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

  return { rows, skipped, approvalDate }
}

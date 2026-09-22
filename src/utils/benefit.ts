import type { Benefit, BenefitCategory } from '@/types'
import { BOOK_LIMIT, BOOKS_PER_MONTH } from '@/data/benefitRules'
import { today } from './date'

/** 합산 건은 원본 권수로 센다 */
const countOf = (b: Benefit) => (b.parts?.length ? b.parts.length : 1)

export const summarizeBenefits = (benefits: Benefit[], total: number, base = today()) => {
  const used = benefits.reduce((s, b) => s + b.amount, 0)
  const remaining = total - used

  // 도서는 연 20만원 소한도, 월 3권
  const books = benefits.filter((b) => b.category === '도서')
  const bookUsed = books.reduce((s, b) => s + b.amount, 0)
  const booksThisMonth = books.filter((b) => b.date.slice(0, 7) === base.slice(0, 7)).reduce((s, b) => s + countOf(b), 0)

  return {
    total,
    used,
    remaining,
    usageRate: total === 0 ? 0 : Math.round((used / total) * 100),
    book: {
      limit: BOOK_LIMIT,
      used: bookUsed,
      remaining: BOOK_LIMIT - bookUsed,
      usageRate: Math.round((bookUsed / BOOK_LIMIT) * 100),
      thisMonth: booksThisMonth,
      perMonth: BOOKS_PER_MONTH,
    },
  }
}

/** 해당 월(YYYY-MM)에 신청한 도서 권수 */
export const booksInMonth = (benefits: Benefit[], ym: string) =>
  benefits.filter((b) => b.category === '도서' && b.date.slice(0, 7) === ym).reduce((s, b) => s + countOf(b), 0)

export const monthlyBenefits = (benefits: Benefit[], year: number) =>
  Array.from({ length: 12 }, (_, i) => {
    const prefix = `${year}-${String(i + 1).padStart(2, '0')}`
    return {
      month: i + 1,
      amount: benefits.filter((b) => b.date.startsWith(prefix)).reduce((s, b) => s + b.amount, 0),
    }
  })

export const byCategory = (benefits: Benefit[]) => {
  const map = new Map<BenefitCategory, number>()
  for (const b of benefits) map.set(b.category, (map.get(b.category) ?? 0) + b.amount)
  return [...map.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount)
}

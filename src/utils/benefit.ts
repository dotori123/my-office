import type { Benefit, BenefitCategory } from '@/types'

export const summarizeBenefits = (benefits: Benefit[], total: number) => {
  const used = benefits.reduce((s, b) => s + b.amount, 0)
  const remaining = total - used
  return { total, used, remaining, usageRate: total === 0 ? 0 : Math.round((used / total) * 100) }
}

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

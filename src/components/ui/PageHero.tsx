import type { ReactNode } from 'react'

/** 가운데 정렬 — 작은 레이블 + 큰 제목 + 설명 + CTA */
export function PageHero({ eyebrow, title, sub, action }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center">
      {eyebrow && <p className="text-body-sm text-mid">{eyebrow}</p>}
      <h1 className="mt-2 text-heading-sm font-bold md:text-heading">{title}</h1>
      {sub && <p className="mt-3 max-w-[560px] text-body-sm text-mid md:text-body">{sub}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

import type { ReactNode } from 'react'
import { cx } from './cx'

/** 전체 너비 섹션. 흰색 / #f5f5f7 을 번갈아 써서 구분선 없이 리듬을 만든다 */
export function Band({
  tone = 'white',
  children,
  className,
  inner,
}: {
  tone?: 'white' | 'gray'
  children: ReactNode
  className?: string
  inner?: string
}) {
  return (
    <section className={cx(tone === 'gray' ? 'bg-canvas' : 'bg-paper', className)}>
      <div className={cx('mx-auto max-w-[1200px] px-5 py-12 md:px-10 md:py-16', inner)}>{children}</div>
    </section>
  )
}

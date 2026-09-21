import type { ReactNode } from 'react'
import { cx } from './cx'

/** 28px 라운드, 테두리·그림자 없음 */
export function Card({
  children,
  className,
  title,
  eyebrow,
  action,
  tone = 'white',
}: {
  children: ReactNode
  className?: string
  title?: ReactNode
  /** 제목 위 작은 레이블 */
  eyebrow?: ReactNode
  action?: ReactNode
  /** 흰 밴드 위에 올릴 땐 gray */
  tone?: 'white' | 'gray'
}) {
  return (
    <section className={cx('rounded-card p-7', tone === 'gray' ? 'bg-canvas' : 'bg-paper', className)}>
      {(title || action || eyebrow) && (
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            {eyebrow && <p className="text-caption text-mid">{eyebrow}</p>}
            {title && <h2 className="text-body font-semibold">{title}</h2>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

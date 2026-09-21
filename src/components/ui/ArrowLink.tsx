import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cx } from './cx'

/** 꺾쇠가 붙은 인라인 텍스트 링크 */
export function ArrowLink({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={cx('inline-flex items-center gap-0.5 text-body-sm text-link hover:underline', className)}>
      {children}
      <span aria-hidden className="text-[1.1em] leading-none">
        ›
      </span>
    </Link>
  )
}

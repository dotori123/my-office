import type { ReactNode } from 'react'
import { cx } from './cx'

export function Stat({ label, value, sub, className }: { label: string; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-[20px] bg-canvas p-5', className)}>
      <p className="text-caption text-mid">{label}</p>
      <p className="mt-1 text-body-lg font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-micro text-mid">{sub}</p>}
    </div>
  )
}

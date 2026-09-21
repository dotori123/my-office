import { cx } from './cx'

export function ProgressBar({ value, color = 'bg-ink', className }: { value: number; color?: string; className?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-wash', className)} role="progressbar" aria-valuenow={v}>
      <div className={cx('h-full rounded-full transition-[width] duration-500', color)} style={{ width: `${v}%` }} />
    </div>
  )
}

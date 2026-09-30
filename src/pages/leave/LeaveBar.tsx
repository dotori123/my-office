import { cx } from '@/components/ui'

/**
 * 연차 바 — 사용 · 예정 · 잔여를 한 줄에 나눠 칠한다.
 * 남은 연차가 눈에 띄도록 잔여 칸만 파랗게.
 */
export function LeaveBar({
  used,
  planned,
  remaining,
  className,
}: {
  used: number
  planned: number
  remaining: number
  className?: string
}) {
  const parts = [
    { key: 'used', label: '사용', days: used, color: 'bg-ink' },
    { key: 'planned', label: '예정', days: planned, color: 'bg-ink/30' },
    { key: 'remaining', label: '잔여', days: remaining, color: 'bg-blue' },
  ].map((p) => ({ ...p, days: Math.max(0, p.days) }))
  const sum = parts.reduce((s, p) => s + p.days, 0)

  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-wash', className)}>
      <div className="flex h-full gap-[2px]">
        {parts
          .filter((p) => p.days > 0)
          .map((p) => (
            <div
              key={p.key}
              title={`${p.label} ${p.days}일`}
              className={cx('h-full transition-[width] duration-500', p.color)}
              style={{ width: `${sum === 0 ? 0 : (p.days / sum) * 100}%` }}
            />
          ))}
      </div>
    </div>
  )
}

/** 바 아래 색 설명 */
export function LeaveBarLegend({ planned }: { planned: number }) {
  const items = [
    { label: '사용', color: 'bg-ink' },
    ...(planned > 0 ? [{ label: '예정', color: 'bg-ink/30' }] : []),
    { label: '잔여', color: 'bg-blue' },
  ]
  return (
    <span className="flex items-center gap-3">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1">
          <span className={cx('size-2 rounded-full', i.color)} />
          {i.label}
        </span>
      ))}
    </span>
  )
}

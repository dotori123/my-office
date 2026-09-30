import { cx } from '@/components/ui'
import { yearEndOutcome } from '@/utils/leave'

/**
 * 연차 바 — 사용 · 예정 · 남은 연차를 한 줄에 나눠 칠한다.
 * 남은 연차 중 연말에 수당으로 받을 수 있는 만큼은 파랗게 보여 준다.
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
  const { payout, expire } = yearEndOutcome(remaining)
  const parts = [
    { key: 'used', label: '사용', days: Math.max(0, used), color: 'bg-ink' },
    { key: 'planned', label: '예정', days: Math.max(0, planned), color: 'bg-ink/30' },
    { key: 'expire', label: '남음', days: expire, color: 'bg-transparent' },
    { key: 'payout', label: '수당 가능', days: payout, color: 'bg-blue' },
  ]
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
export function LeaveBarLegend({ planned, remaining }: { planned: number; remaining: number }) {
  const items = [
    { label: '사용', color: 'bg-ink' },
    ...(planned > 0 ? [{ label: '예정', color: 'bg-ink/30' }] : []),
    ...(remaining > 0 ? [{ label: '수당 가능', color: 'bg-blue' }] : []),
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

import { cx } from '@/components/ui'
import { showsExpiry, yearEndOutcome } from '@/utils/leave'

/**
 * 연차 바 — 사용 · 예정을 칠하고, 남은 칸은 비워 둔다.
 * 연말이 가까워지면 남은 칸 중 안 쓰면 사라질 몫을 주황으로 칠한다.
 * 수당으로 받을 몫은 빈칸 그대로 (아래 안내 문구가 설명한다).
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
  const expiring = showsExpiry(remaining)
  const parts = [
    { key: 'used', label: '사용', days: Math.max(0, used), color: 'bg-ink' },
    { key: 'planned', label: '예정', days: Math.max(0, planned), color: 'bg-ink/30' },
    ...(expiring
      ? [
          { key: 'expire', label: '안 쓰면 사라짐', days: expire, color: 'bg-ember/40' },
          { key: 'payout', label: '수당', days: payout, color: 'bg-transparent' },
        ]
      : [{ key: 'remaining', label: '잔여', days: Math.max(0, remaining), color: 'bg-transparent' }]),
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

/** 바 아래 색 설명 — 칠해진 색만 */
export function LeaveBarLegend({ planned, remaining }: { planned: number; remaining: number }) {
  const items = [
    { label: '사용', color: 'bg-ink' },
    ...(planned > 0 ? [{ label: '예정', color: 'bg-ink/30' }] : []),
    ...(showsExpiry(remaining) ? [{ label: '사라질 연차', color: 'bg-ember/40' }] : []),
  ]
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1">
          <span className={cx('size-2 rounded-full', i.color)} />
          {i.label}
        </span>
      ))}
    </span>
  )
}

import { cx } from './cx'

/** 필 모양 세그먼트 컨트롤 */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string }[]
  value: T
  onChange: (key: T) => void
}) {
  return (
    <div className="inline-flex gap-1 rounded-pill bg-wash p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={cx(
            'rounded-pill px-4 py-1.5 text-caption transition-colors sm:px-5 sm:text-body-sm',
            value === t.key ? 'bg-paper text-ink' : 'text-deep hover:text-ink',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

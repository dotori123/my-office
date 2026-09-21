import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'

const cx = (...classes: (string | false | undefined | null)[]) => classes.filter(Boolean).join(' ')

/* ---------- Band : full-bleed section, alternating white / #f5f5f7 ---------- */
export function Band({ tone = 'white', children, className, inner }: { tone?: 'white' | 'gray'; children: ReactNode; className?: string; inner?: string }) {
  return (
    <section className={cx(tone === 'gray' ? 'bg-canvas' : 'bg-paper', className)}>
      <div className={cx('mx-auto max-w-[1200px] px-5 py-12 md:px-10 md:py-16', inner)}>{children}</div>
    </section>
  )
}

/* ---------- Card : 28px radius, no border, no shadow ---------- */
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

/* ---------- ProgressBar ---------- */
export function ProgressBar({ value, color = 'bg-ink', className }: { value: number; color?: string; className?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-wash', className)} role="progressbar" aria-valuenow={v}>
      <div className={cx('h-full rounded-full transition-[width] duration-500', color)} style={{ width: `${v}%` }} />
    </div>
  )
}

/* ---------- Button : pill. primary = the only blue in the UI ---------- */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
const variantClass: Record<Variant, string> = {
  primary: 'bg-blue text-paper hover:bg-blue-hover disabled:bg-wash disabled:text-mid',
  secondary: 'border border-ink/80 text-ink hover:bg-wash',
  ghost: 'text-link hover:underline',
  danger: 'text-mid hover:text-ink hover:underline',
}
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-pill font-normal transition-colors disabled:cursor-not-allowed',
        size === 'sm' ? 'px-4 py-1.5 text-caption' : 'px-5 py-[11px] text-body-sm',
        variantClass[variant],
        className,
      )}
      {...props}
    />
  )
}

/* ---------- ArrowLink : inline text link with chevron ---------- */
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

/* ---------- Badge : 36px radius ---------- */
export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center rounded-[36px] bg-wash px-2.5 py-0.5 text-micro font-medium text-ink', className)}>
      {children}
    </span>
  )
}

/* ---------- Form ---------- */
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-caption text-deep">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-micro text-mid">{hint}</span>}
    </label>
  )
}

const inputClass =
  // 포커스는 무채색 헤어라인 강조. 파랑(#0071e3)은 채움 CTA 버튼 전용.
  'w-full rounded-[12px] border border-hairline bg-paper px-4 py-3 text-body-sm text-ink outline-none placeholder:text-mid focus:border-ink focus:ring-2 focus:ring-ink/10'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(inputClass, className)} {...props} />
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(inputClass, className)} {...props} />
}

/**
 * 금액 입력 — 화면에는 1,000 단위 콤마를 찍고 값은 숫자 문자열로 넘긴다.
 * type="number" 는 콤마를 표시할 수 없어 text + inputMode 로 처리한다.
 */
export function MoneyInput({
  value,
  onValueChange,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  /** 숫자만 담긴 문자열 */
  value: string
  onValueChange: (digits: string) => void
}) {
  const display = value === '' ? '' : Number(value).toLocaleString('ko-KR')
  return (
    <Input
      inputMode="numeric"
      value={display}
      onChange={(e) => onValueChange(e.target.value.replace(/[^\d]/g, ''))}
      className={className}
      {...props}
    />
  )
}

/* ---------- Modal ---------- */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)

    // 뒤 배경 스크롤 잠금.
    // 스크롤 컨테이너가 <html> 이라 body 에 overflow 를 줘도 잠기지 않는다.
    // 스크롤바 폭만큼 padding 을 줘서 레이아웃이 흔들리지 않게 한다.
    const html = document.documentElement
    const prevOverflow = html.style.overflow
    const prevPadding = html.style.paddingRight
    const gap = window.innerWidth - html.clientWidth
    html.style.overflow = 'hidden'
    if (gap > 0) html.style.paddingRight = `${gap}px`

    return () => {
      window.removeEventListener('keydown', onKey)
      html.style.overflow = prevOverflow
      html.style.paddingRight = prevPadding
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-card bg-paper p-7 sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-6 flex items-center justify-between">
          <h3 className="text-body-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-ink text-ink transition-colors hover:bg-wash"
            aria-label="닫기"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}

/* ---------- EmptyState ---------- */
export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-10">
      <p className="text-body-sm text-mid">{text}</p>
    </div>
  )
}

/* ---------- Tabs : segmented pill ---------- */
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

/* ---------- Stat ---------- */
export function Stat({ label, value, sub, className }: { label: string; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-[20px] bg-canvas p-5', className)}>
      <p className="text-caption text-mid">{label}</p>
      <p className="mt-1 text-body-lg font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-micro text-mid">{sub}</p>}
    </div>
  )
}

/* ---------- PageHero : centered eyebrow + big title ---------- */
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

export { cx }

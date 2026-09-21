import type { ButtonHTMLAttributes } from 'react'
import { cx } from './cx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

/** primary 의 파랑이 UI 안에서 유일한 유채색이다 */
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

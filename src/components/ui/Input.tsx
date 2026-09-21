import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react'
import { cx } from './cx'

/** 포커스는 무채색 헤어라인 강조. 파랑(#0071e3)은 채움 CTA 버튼 전용 */
const inputClass =
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

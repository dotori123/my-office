import type { ReactNode } from 'react'

/** 라벨 + 입력 + 힌트를 묶는 폼 한 줄 */
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-caption text-deep">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-micro text-mid">{hint}</span>}
    </label>
  )
}

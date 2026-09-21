import { useEffect, type ReactNode } from 'react'

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

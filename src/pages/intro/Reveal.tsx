import { useEffect, useRef, type ReactNode } from 'react'
import { cx } from '@/components/ui'

/**
 * 화면에 들어오면 아래에서 떠오르며 나타난다.
 * prefers-reduced-motion 이면 그냥 보이게 둔다.
 */
export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  /** 초 단위 — 여러 개를 순차로 띄울 때 */
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.opacity = '1'
      el.style.transform = 'none'
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        el.style.transitionDelay = `${delay}s`
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
        io.disconnect()
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={cx('translate-y-6 opacity-0 transition-[opacity,transform] duration-700 ease-out', className)}
    >
      {children}
    </div>
  )
}

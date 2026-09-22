import { useEffect, useRef } from 'react'

/** 화면에 들어오면 0 에서 목표값까지 올라간다 */
export default function CountUp({
  to,
  suffix = '',
  decimals = 0,
  format: customFormat,
  delay = 0,
}: {
  to: number
  suffix?: string
  decimals?: number
  /** 기본 표기(toFixed + suffix) 대신 쓸 포맷터 — 예: 천 단위 구분 */
  format?: (n: number) => string
  /** 초 단위. 다른 연출과 순서를 맞출 때 */
  delay?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const format = customFormat ?? ((n: number) => n.toFixed(decimals) + suffix)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = format(to)
      return
    }

    let raf = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const start = performance.now() + delay * 1000
        const tick = (now: number) => {
          const t = Math.max(0, Math.min(1, (now - start) / 900))
          const eased = 1 - Math.pow(1 - t, 3)
          el.textContent = format(to * eased)
          if (t < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.5 },
    )
    io.observe(el)

    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to, suffix, decimals, customFormat, delay])

  return <span ref={ref}>{customFormat ? customFormat(0) : `0${suffix}`}</span>
}

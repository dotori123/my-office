import { useEffect, useRef } from 'react'

/** 화면에 들어오면 0 에서 목표값까지 올라간다 */
export default function CountUp({ to, suffix = '', decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const format = (n: number) => n.toFixed(decimals) + suffix

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = format(to)
      return
    }

    let raf = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 900)
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
  }, [to, suffix, decimals])

  return <span ref={ref}>0{suffix}</span>
}

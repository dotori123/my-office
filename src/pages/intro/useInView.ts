import { useEffect, useState, type RefObject } from 'react'

/**
 * 요소가 화면에 들어오면 true 가 되고 그 뒤로는 유지된다.
 * 연출을 한 번만 트리거할 때 쓴다. prefers-reduced-motion 이면 바로 true.
 */
export function useInView(ref: RefObject<Element | null>, threshold = 0.4) {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setInView(true)
        io.disconnect()
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, threshold])

  return inView
}

import { useEffect, useRef, type RefObject } from 'react'

/**
 * 긴 섹션(stage) 안에서 스크롤이 얼마나 진행됐는지 0~1 로 알려준다.
 * 매 프레임 ref 값만 갱신하므로 리렌더가 일어나지 않는다 —
 * 값을 쓰는 쪽(three 캔버스, 텍스트)에서 직접 스타일을 바꾼다.
 */
export function useStageProgress(stageRef: RefObject<HTMLElement | null>) {
  const progress = useRef(0)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    let raf = 0
    const update = () => {
      raf = requestAnimationFrame(update)
      const rect = stage.getBoundingClientRect()
      const scrollable = rect.height - window.innerHeight
      if (scrollable <= 0) {
        progress.current = 0
        return
      }
      progress.current = Math.max(0, Math.min(1, -rect.top / scrollable))
    }
    update()

    return () => cancelAnimationFrame(raf)
  }, [stageRef])

  return progress
}

/** a→b 를 0~1 구간에 맞춰 부드럽게 (easeInOut) */
export const ramp = (p: number, from: number, to: number) => {
  const t = Math.max(0, Math.min(1, (p - from) / (to - from)))
  return t * t * (3 - 2 * t)
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

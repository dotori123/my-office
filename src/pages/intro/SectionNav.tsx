import { useEffect, useState } from 'react'
import { cx } from '@/components/ui'

/**
 * 오른쪽에 붙는 섹션 점 내비.
 * 화면 가운데를 지나는 섹션을 표시하고, 누르면 그 섹션으로 옮긴다.
 * 히어로에서는 숨기고, 마무리에서는 점 대신 "맨 위로" 버튼을 보여준다.
 * 점 내비는 좁은 화면에서 그리지 않지만 맨 위로 버튼은 모든 폭에서 보인다.
 */
export const SECTIONS = [
  { id: 'recommend', label: '연차 추천' },
  { id: 'benefit', label: '지원비' },
  { id: 'why', label: '왜 만들었나' },
  { id: 'features', label: '기능' },
  { id: 'dashboard', label: '대시보드' },
  { id: 'import', label: '가져오기' },
  { id: 'privacy', label: '데이터' },
  { id: 'faq', label: 'FAQ' },
] as const

/** 내비에는 없지만 위치 판단에 쓰는 섹션 */
const HIDDEN_AT = ['hero', 'end']

export default function SectionNav() {
  const [active, setActive] = useState<string | null>(null)
  const [atEnd, setAtEnd] = useState(false)

  useEffect(() => {
    const ids = [...HIDDEN_AT, ...SECTIONS.map((s) => s.id)]
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null)
    // 화면 세로 가운데 10% 띠를 지나는 섹션을 활성으로
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )
    els.forEach((el) => io.observe(el))

    // 마무리는 짧아서 화면 가운데에 안 걸릴 수 있다 — 절반 넘게 보이면 끝으로 친다
    const end = document.getElementById('end')
    const endIo = new IntersectionObserver(([e]) => setAtEnd(e.isIntersecting), { threshold: 0.5 })
    if (end) endIo.observe(end)

    return () => {
      io.disconnect()
      endIo.disconnect()
    }
  }, [])

  const visible = active !== null && !HIDDEN_AT.includes(active) && !atEnd
  // 검정 밴드 위에서는 색을 뒤집는다
  const dark = active === 'why'

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <>
      <nav
        aria-label="섹션"
        className={cx(
          'fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-2.5 transition-opacity duration-500 md:flex',
          visible ? 'opacity-100' : 'pointer-events-none opacity-0',
          dark ? 'text-paper' : 'text-ink',
        )}
      >
        {SECTIONS.map((s) => {
          const on = s.id === active
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => go(s.id)}
              aria-label={s.label}
              aria-current={on ? 'true' : undefined}
              className="group flex items-center gap-2.5 py-0.5"
            >
              <span className={cx('text-micro transition-opacity duration-200', on ? 'opacity-70' : 'opacity-0 group-hover:opacity-60')}>
                {s.label}
              </span>
              <span
                className={cx(
                  'block rounded-full bg-current transition-all duration-300',
                  on ? 'size-2 opacity-100' : 'size-1.5 opacity-30 group-hover:opacity-60',
                )}
              />
            </button>
          )
        })}
      </nav>

      {/* 마무리에서 점 자리에 나타나는 맨 위로 버튼. 모바일은 오른쪽 아래 */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="맨 위로"
        className={cx(
          'fixed bottom-8 right-5 z-40 flex size-11 items-center justify-center rounded-full border border-ink bg-paper text-ink transition-[opacity,transform,background-color] duration-500 hover:bg-wash md:bottom-auto md:right-6 md:top-1/2 md:-translate-y-1/2',
          atEnd ? 'opacity-100' : 'pointer-events-none translate-y-2 opacity-0 md:translate-y-[calc(-50%+8px)]',
        )}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" />
        </svg>
      </button>
    </>
  )
}

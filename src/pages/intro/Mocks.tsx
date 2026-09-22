import { useEffect, useRef, useState } from 'react'
import { cx } from '@/components/ui'
import CountUp from './CountUp'
import { useInView } from './useInView'

/**
 * 소개 페이지용 화면 미리보기.
 * 실제 데이터를 쓰지 않고 예시 값으로 그린 목업이다 — 개인정보가 들어가지 않는다.
 */

/** 연차 — 잔여 일수와 사용률 */
export function LeaveMock() {
  return (
    <div className="rounded-[16px] bg-paper p-4">
      <p className="text-micro text-mid">잔여 연차</p>
      <p className="mt-1 text-subheading font-bold tabular-nums">8.5일</p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-wash">
        <div className="h-full w-[43%] rounded-full bg-ink" />
      </div>
      <p className="mt-1.5 text-right text-micro text-mid">사용률 43%</p>
    </div>
  )
}

/** 지원비 — 월별 막대 */
export function BenefitMock() {
  const bars = [20, 0, 35, 50, 12, 0, 28, 8, 92, 40, 18, 5]
  return (
    <div className="rounded-[16px] bg-paper p-4">
      <p className="text-micro text-mid">월별 사용액</p>
      <div className="mt-3 flex h-14 items-end gap-[3px]">
        {bars.map((v, i) => (
          <div key={i} className="flex-1">
            <div
              className={cx('w-full rounded-t-[3px]', i === 8 ? 'bg-ink' : 'bg-hairline')}
              style={{ height: `${Math.max(4, (v / 92) * 56)}px` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/** 캘린더 — 유형별 색이 찍힌 미니 달력 */
export function CalendarMock() {
  const marks: Record<number, string> = { 3: 'bg-citrus', 9: 'bg-blush', 10: 'bg-blush', 14: 'bg-sky', 18: 'bg-citrus', 19: 'bg-starlight' }
  return (
    <div className="rounded-[16px] bg-paper p-4">
      <p className="text-micro text-mid">9월</p>
      <div className="mt-3 grid grid-cols-7 gap-1">
        {Array.from({ length: 21 }, (_, i) => (
          <div key={i} className="flex h-5 items-center justify-center rounded-[4px] bg-canvas">
            <span className={cx('size-1.5 rounded-full', marks[i] ?? 'bg-transparent')} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** 프로젝트 — 링크 필 */
export function ProjectMock() {
  const links = [
    ['테스트', 'bg-sky'],
    ['운영', 'bg-citrus'],
    ['WBS', 'bg-starlight'],
    ['저장소', 'bg-silver'],
    ['디자인', 'bg-blush'],
  ]
  return (
    <div className="rounded-[16px] bg-paper p-4">
      <p className="text-micro text-mid">홈페이지 리뉴얼</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {links.map(([label, color]) => (
          <span key={label} className={cx('rounded-pill px-2.5 py-1 text-micro text-ink', color)}>
            {label} ↗
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * 연차 추천 — 일주일 띠.
 * 연차 하루가 공휴일·주말과 이어져 연속 휴식이 되는 걸 한눈에 보여 준다.
 * 2026년 추석(9/24–26) 기준 실제 달력이다.
 */
export function RecommendStrip() {
  type Kind = 'work' | 'leave' | 'holiday' | 'weekend'
  const days: { d: number; w: string; kind: Kind; tag?: string }[] = [
    { d: 21, w: '월', kind: 'work' },
    { d: 22, w: '화', kind: 'work' },
    { d: 23, w: '수', kind: 'leave', tag: '연차' },
    { d: 24, w: '목', kind: 'holiday', tag: '연휴' },
    { d: 25, w: '금', kind: 'holiday', tag: '추석' },
    { d: 26, w: '토', kind: 'holiday', tag: '연휴' },
    { d: 27, w: '일', kind: 'weekend', tag: '주말' },
  ]
  const cell: Record<Kind, string> = {
    work: 'border border-hairline bg-paper text-mid',
    leave: 'bg-citrus text-ink',
    holiday: 'bg-blush text-ink',
    weekend: 'bg-wash text-ink',
  }
  const restStart = days.findIndex((x) => x.kind !== 'work') + 1
  const restCount = days.length - restStart + 1

  return (
    <div>
      {/* 쉬는 날 위로 걸치는 브래킷 */}
      <div className="mb-2 grid grid-cols-7 gap-1.5">
        <div className="flex items-center gap-2" style={{ gridColumn: `${restStart} / span ${restCount}` }}>
          <span className="h-px flex-1 bg-ink" />
          <span className="whitespace-nowrap text-micro font-medium">연속 휴식 {restCount}일</span>
          <span className="h-px flex-1 bg-ink" />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((x) => (
          <div key={x.d} className={cx('flex flex-col items-center rounded-[12px] px-1 pb-2 pt-2.5', cell[x.kind])}>
            <span className="text-micro opacity-70">{x.w}</span>
            <span className={cx('mt-0.5 text-body-sm tabular-nums', x.kind === 'leave' ? 'font-bold' : 'font-medium')}>{x.d}</span>
            <span className="mt-1.5 h-4 text-[11px] leading-4">{x.tag ?? ' '}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-micro text-mid">
        {[
          ['bg-citrus', '연차 1일'],
          ['bg-blush', '추석 연휴'],
          ['bg-wash', '주말'],
        ].map(([color, label]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={cx('size-2 rounded-full', color)} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * 지원비 잔액 — 카테고리별로 나눠 칠한 막대.
 * 대시보드 목업과 같은 숫자(총 300,000원 중 291,000원 사용)를 쓴다.
 */
export function BenefitBreakdown() {
  const ref = useRef<HTMLDivElement>(null)
  const on = useInView(ref)
  const total = 300000
  const parts = [
    { label: '도서', amount: 66000, color: 'bg-starlight' },
    { label: '교육', amount: 120000, color: 'bg-sky' },
    { label: '소프트웨어', amount: 105000, color: 'bg-silver' },
  ]
  const used = parts.reduce((s, p) => s + p.amount, 0)
  const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`
  // 막대 세 토막이 차례로 차오른 뒤 (0.25초 간격) 잔액이 내려온다
  const STEP = 0.25
  const remainingDelay = parts.length * STEP

  return (
    <div ref={ref}>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-caption text-mid">남은 지원비</p>
          <p className="mt-1 text-heading-sm font-bold tabular-nums md:text-heading">
            <CountUp to={total - used} format={won} delay={remainingDelay} />
          </p>
        </div>
        <p className="text-body-sm text-mid">총 {won(total)}</p>
      </div>

      <div className="mt-6 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-paper">
        {parts.map((p, i) => (
          <div
            key={p.label}
            className={cx('h-full transition-[width] duration-700 ease-out', p.color)}
            style={{ width: on ? `${(p.amount / total) * 100}%` : 0, transitionDelay: `${i * STEP}s` }}
          />
        ))}
      </div>
      <p
        className="mt-2 text-right text-micro text-mid transition-opacity duration-500"
        style={{ opacity: on ? 1 : 0, transitionDelay: `${remainingDelay}s` }}
      >
        사용률 {Math.round((used / total) * 100)}%
      </p>

      <ul className="mt-5 grid grid-cols-3 gap-3">
        {parts.map((p, i) => (
          <li
            key={p.label}
            className="rounded-[16px] bg-paper p-4 transition-[opacity,transform] duration-500 ease-out"
            style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(8px)', transitionDelay: `${i * STEP}s` }}
          >
            <p className="flex items-center gap-1.5 text-caption text-mid">
              <span className={cx('size-2 rounded-full', p.color)} />
              {p.label}
            </p>
            <p className="mt-1 text-body-sm font-medium tabular-nums">
              <CountUp to={p.amount} format={won} delay={i * STEP} />
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 지원비 최근 사용 — 합산 건이 화면에 들어오고 잠시 뒤 펼쳐진다 */
export function BenefitRecent() {
  const ref = useRef<HTMLUListElement>(null)
  const on = useInView(ref)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!on) return
    const t = setTimeout(() => setOpen(true), 700)
    return () => clearTimeout(t)
  }, [on])
  const rows: { date: string; name: string; cat: string; amount: string; parts?: [string, string][] }[] = [
    {
      date: '09.17',
      name: 'Claude Pro 3개월 구독',
      cat: '소프트웨어',
      amount: '60,000원',
      parts: [
        ['09.03', '20,000원'],
        ['09.10', '20,000원'],
        ['09.17', '20,000원'],
      ],
    },
    { date: '09.10', name: 'UX 라이팅 워크숍', cat: '교육', amount: '42,000원' },
    { date: '09.02', name: 'IntelliJ 연간 구독', cat: '소프트웨어', amount: '45,000원' },
  ]
  return (
    <ul ref={ref} className="space-y-2">
      {rows.map((r) => (
        <li key={r.date + r.name} className="rounded-[16px] bg-paper px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-body-sm font-medium">{r.name}</p>
              <p className="text-caption text-mid">
                {r.date} · {r.cat}
              </p>
              {r.parts && (
                <p className="flex items-center gap-1 text-caption text-mid">
                  {r.parts.length}건 합산
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={cx('transition-transform duration-300', open && 'rotate-180')}
                  >
                    <path d="M3 4.5l3 3 3-3" />
                  </svg>
                </p>
              )}
            </div>
            <span className="shrink-0 text-body-sm font-medium tabular-nums">{r.amount}</span>
          </div>
          {r.parts && (
            // grid-rows 0fr → 1fr 로 높이를 자연스럽게 펼친다
            <div
              className="grid transition-[grid-template-rows,opacity] duration-500 ease-out"
              style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}
            >
              <ul className="min-h-0 overflow-hidden">
                {r.parts.map(([d, a], i) => (
                  <li
                    key={d}
                    className={cx('flex justify-between border-l border-hairline pl-3 text-micro tabular-nums text-mid', i === 0 && 'mt-2')}
                  >
                    <span>{d} · Claude Pro 1개월 구독</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

/** 대시보드 전체 미리보기 */
export function DashboardMock() {
  return (
    <div className="overflow-hidden rounded-card border border-hairline bg-paper">
      {/* 상단바 */}
      <div className="flex items-center gap-4 border-b border-hairline px-5 py-2.5">
        <span className="text-[10px] font-semibold">MY OFFICE</span>
        <span className="ml-auto flex gap-3 text-[10px] text-mid">
          <span className="text-ink">Dashboard</span>
          <span>연차</span>
          <span>지원비</span>
          <span>Calendar</span>
        </span>
      </div>

      {/* 히어로 */}
      <div className="flex flex-col items-center px-5 py-8">
        <p className="text-micro text-mid">다음 휴가까지</p>
        <p className="mt-1 text-[44px] font-bold leading-none tracking-[-1.5px]">D-3</p>
        <p className="mt-2 text-micro text-mid">09.24 (목) – 09.28 (월) · 5일 휴식</p>
      </div>

      {/* 카드 */}
      <div className="grid grid-cols-2 gap-3 bg-canvas p-4">
        {[
          ['연차', '8.5일', '사용 6.5일 / 총 15일', 43],
          ['지원비', '9,000원', '사용 291,000원 / 총 300,000원', 97],
        ].map(([label, value, sub, pct]) => (
          <div key={label as string} className="rounded-[16px] bg-paper p-4">
            <p className="text-micro text-mid">{label}</p>
            <p className="mt-1 text-body font-bold tabular-nums">{value}</p>
            <p className="mt-0.5 text-[10px] text-mid">{sub}</p>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-wash">
              <div className="h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

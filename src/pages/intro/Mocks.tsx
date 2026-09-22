import { cx } from '@/components/ui'

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

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/store/AppContext'
import { useSeo } from '@/hooks/useSeo'
import { ArrowLink, Band, Card, ProgressBar, cx } from '@/components/ui'
import { HOLIDAYS } from '@/data/holidays'
import { addDays, buildDayOffContext, countWorkingDays, diffDays, fmtFull, fmtShort, isDayOff, tenureText, today, weekdayKo } from '@/utils/date'
import { fmtDays, fmtWon } from '@/utils/format'
import { leaveLabel, summarizeLeaves, yearEndOutlook } from '@/utils/leave'
import { summarizeBenefits } from '@/utils/benefit'
import { EVENT_STYLE, type UnifiedEvent } from '@/pages/calendar/eventStyle'
import ProjectCard from '@/pages/project/ProjectCard'
import { useOpenProfile } from '@/components/layout/ProfileModal'

export default function DashboardPage() {
  useSeo({
    title: 'MY OFFICE — 나의 회사생활 대시보드',
    description: '남은 연차, 지원비 잔액, 다음 휴일까지 며칠 남았는지. 회사생활에 필요한 개인 정보를 열자마자 한 화면에서 확인하세요.',
    path: '/',
  })
  const { state } = useApp()
  const { user, settings, leaves, benefits, events, projects } = state
  const base = today()

  const openProfile = useOpenProfile()

  // 아직 아무것도 입력하지 않은 첫 방문 상태
  const isNew = !user.name && !user.joinDate
  const profileLine = [
    [user.company, user.department, user.position].filter(Boolean).join(' · '),
    user.joinDate && `입사 ${fmtFull(user.joinDate)}`,
    user.joinDate && `근속 ${tenureText(user.joinDate)}`,
  ]
    .filter(Boolean)
    .join(' · ')

  const pinnedProjects = useMemo(() => {
    // 프로젝트 페이지에서 정한 순서를 그대로 따른다
    const ordered = [...projects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const pinned = ordered.filter((p) => p.pinned)
    return (pinned.length ? pinned : ordered).slice(0, 3)
  }, [projects])

  const leave = summarizeLeaves(leaves, settings.totalLeave)
  const benefit = summarizeBenefits(benefits, settings.totalBenefit)

  // 연말에 소멸될 연차 — 4분기에 들어서면 알려준다
  const outlook = useMemo(
    () => yearEndOutlook(leave.remaining, buildDayOffContext(leaves, events), base),
    [leave.remaining, leaves, events, base],
  )

  // 다가오는 일정 (공휴일 + 연차 + 회사/개인 일정) 상위 5개
  const upcoming = useMemo<UnifiedEvent[]>(() => {
    const list: UnifiedEvent[] = [
      ...HOLIDAYS.map((h) => ({ id: h.date, date: h.date, title: h.name, type: 'holiday' as const })),
      ...leaves.map((l) => ({ id: l.id, date: l.startDate, title: leaveLabel(l), type: 'leave' as const })),
      ...events.map((e) => ({ id: e.id, date: e.date, title: e.title, type: e.type })),
    ]
    return list.filter((e) => e.date >= base).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5)
  }, [leaves, events, base])

  // 다음 휴가: 오늘 이후 첫 번째 출근하지 않는 평일
  const nextOff = useMemo(() => {
    const ctx = buildDayOffContext(leaves, events)
    for (let d = addDays(base, 1), i = 0; i < 120; d = addDays(d, 1), i++) {
      const day = new Date(d).getDay()
      if (day !== 0 && day !== 6 && isDayOff(d, ctx)) {
        let end = d
        while (isDayOff(addDays(end, 1), ctx)) end = addDays(end, 1)
        let start = d
        while (isDayOff(addDays(start, -1), ctx)) start = addDays(start, -1)
        const onLeave = ctx.leaveMap.get(d)
        const label = (onLeave && leaveLabel(onLeave)) ?? upcoming.find((u) => u.date === d)?.title ?? '휴무'
        return { date: d, start, end, label, dday: diffDays(base, start) }
      }
    }
    return null
  }, [leaves, events, base, upcoming])

  // 이번 달 근무 현황
  const month = useMemo(() => {
    const ctx = buildDayOffContext(leaves, events)
    const ym = base.slice(0, 7)
    const first = `${ym}-01`
    const lastDate = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0).getDate()
    const last = `${ym}-${String(lastDate).padStart(2, '0')}`
    const total = countWorkingDays(first, last, ctx)
    const passed = countWorkingDays(first, base, ctx)
    const leaveThisMonth = leaves.filter((l) => l.startDate.startsWith(ym)).reduce((s, l) => s + l.amount, 0)
    return { total, passed, remaining: total - passed, leaveThisMonth, label: `${Number(ym.slice(5, 7))}월` }
  }, [leaves, events, base])

  return (
    <>
      {/* Hero — 가운데 정렬, 커다란 D-day */}
      <Band inner="py-16 md:py-24">
        <div className="flex flex-col items-center text-center">
          <p className="text-body-sm text-mid">{user.name ? `안녕하세요, ${user.name}님` : '안녕하세요'}</p>
          {nextOff ? (
            <>
              <p className="mt-3 text-body text-ink">다음 휴가까지</p>
              <h1 className="mt-1 text-[72px] font-bold leading-none tracking-[-1.44px] md:text-display">
                {nextOff.dday === 0 ? 'D-Day' : `D-${nextOff.dday}`}
              </h1>
              <p className="mt-4 text-body-sm text-mid">
                {fmtShort(nextOff.start)} ({weekdayKo(nextOff.start)}) – {fmtShort(nextOff.end)} ({weekdayKo(nextOff.end)}) ·{' '}
                {diffDays(nextOff.start, nextOff.end) + 1}일 휴식 · {nextOff.label}
              </p>
            </>
          ) : (
            <h1 className="mt-3 text-heading-sm font-bold md:text-heading">오늘도 좋은 하루.</h1>
          )}
          {isNew ? (
            <button
              type="button"
              onClick={openProfile}
              className="mt-6 rounded-pill bg-blue px-5 py-[11px] text-body-sm text-paper hover:bg-blue-hover"
            >
              내 정보 입력하기
            </button>
          ) : (
            <Link to="/leave?tab=recommend" className="mt-6 rounded-pill bg-blue px-5 py-[11px] text-body-sm text-paper hover:bg-blue-hover">
              연차 추천 보기
            </Link>
          )}
          <p className="mt-8 text-caption text-mid">
            {isNew ? '이름·입사일·총 연차를 먼저 입력하면 잔여 연차와 근속기간이 계산돼요.' : profileLine}
          </p>
        </div>
      </Band>

      {/* 연말 소멸 경고 */}
      {outlook.show && (
        <Band inner="pt-0 pb-10 md:pb-14">
          <div
            className={cx(
              'flex flex-col gap-3 rounded-[20px] px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6 md:py-5',
              outlook.level === 'urgent' ? 'bg-starlight' : outlook.level === 'warn' ? 'bg-starlight/60' : 'bg-canvas',
            )}
          >
            <div className="min-w-0">
              <p className={cx('text-body-sm font-medium', outlook.level === 'urgent' ? 'text-ember' : 'text-ink')}>
                {outlook.level === 'urgent' ? '연말까지' : '올해 안에'} 안 쓰면 {fmtDays(leave.remaining)}이 사라져요
              </p>
              <p className="mt-1 text-caption text-mid">
                그중 {fmtDays(outlook.payout)}까지는 수당으로 받을 수 있어요 · 12월 31일까지 근무일 {outlook.workingDaysLeft}일
                {outlook.tooLate && ' · 남은 근무일보다 연차가 많아요'}
              </p>
            </div>
            <Link
              to="/leave?tab=recommend"
              className="shrink-0 self-start rounded-pill bg-ink px-4 py-2 text-caption text-paper transition-colors hover:bg-deep sm:self-auto"
            >
              연차 추천 보기
            </Link>
          </div>
        </Band>
      )}

      {/* 핵심 숫자 */}
      <Band tone="gray">
        <h2 className="text-body-lg font-semibold tracking-[0.007em]">한눈에.</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Card eyebrow="연차" action={<ArrowLink to="/leave">연차 관리</ArrowLink>}>
            <p className="text-heading-sm font-bold tabular-nums md:text-heading">
              {fmtDays(leave.remaining)} <span className="text-body-sm font-normal text-mid">남음</span>
            </p>
            <p className="mt-2 text-body-sm text-mid">
              사용 {fmtDays(leave.used)} / 총 {fmtDays(leave.total)}
              {leave.planned > 0 && ` · 예정 ${fmtDays(leave.planned)}`}
            </p>
            <ProgressBar value={leave.usageRate} className="mt-6" />
            <p className="mt-2 text-right text-micro text-mid">사용률 {leave.usageRate}%</p>
          </Card>

          <Card eyebrow="지원비" action={<ArrowLink to="/benefit">지원비 관리</ArrowLink>}>
            <p className="text-heading-sm font-bold tabular-nums md:text-heading">
              {fmtWon(benefit.remaining)} <span className="text-body-sm font-normal text-mid">남음</span>
            </p>
            <p className="mt-2 text-body-sm text-mid">
              사용 {fmtWon(benefit.used)} / 총 {fmtWon(benefit.total)}
            </p>
            <ProgressBar value={benefit.usageRate} className="mt-6" />
            <p className="mt-2 text-right text-micro text-mid">사용률 {benefit.usageRate}%</p>
          </Card>
        </div>
      </Band>

      {/* 프로젝트 바로가기 — 고정된 프로젝트 (없으면 앞 3개) */}
      <Band>
        <div className="flex items-end justify-between">
          <h2 className="text-body-lg font-semibold tracking-[0.007em]">프로젝트 바로가기.</h2>
          <ArrowLink to="/projects">전체 프로젝트</ArrowLink>
        </div>
        {pinnedProjects.length === 0 ? (
          <p className="mt-6 text-body-sm text-mid">
            아직 등록된 프로젝트가 없어요.{' '}
            <Link to="/projects" className="text-link hover:underline">
              프로젝트를 등록하면
            </Link>{' '}
            테스트·운영 서버, WBS 링크를 여기서 바로 열 수 있어요.
          </p>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pinnedProjects.map((p) => (
              <ProjectCard key={p.id} project={p} tone="gray" compact />
            ))}
          </div>
        )}
      </Band>

      {/* 일정 & 근무 */}
      <Band tone="gray">
        <div className="grid gap-5 md:grid-cols-2">
          <Card title="다가오는 일정" action={<ArrowLink to="/calendar">캘린더</ArrowLink>}>
            {upcoming.length === 0 ? (
              <p className="text-body-sm text-mid">예정된 일정이 없어요.</p>
            ) : (
              <ul className="divide-y divide-hairline/60">
                {upcoming.map((e) => {
                  const s = EVENT_STYLE[e.type]
                  const d = diffDays(base, e.date)
                  return (
                    <li key={`${e.type}-${e.id}`} className="flex items-center gap-3 py-3">
                      <span className="w-14 shrink-0 text-body-sm font-medium tabular-nums">{fmtShort(e.date)}</span>
                      <span className="w-5 shrink-0 text-caption text-mid">{weekdayKo(e.date)}</span>
                      <span className={cx('size-2.5 shrink-0 rounded-full', s.dot)} />
                      <span className="flex-1 truncate text-body-sm">{e.title}</span>
                      <span className="text-caption text-mid tabular-nums">{d === 0 ? '오늘' : `D-${d}`}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card title={`${month.label} 근무 현황`}>
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="근무일" value={`${month.total}일`} />
              <MiniStat label="남은 근무일" value={`${month.remaining}일`} />
              <MiniStat label="이번 달 연차" value={fmtDays(month.leaveThisMonth)} />
            </div>
            <ProgressBar value={(month.passed / month.total) * 100} className="mt-6" />
            <p className="mt-2 text-right text-micro text-mid">
              {month.passed} / {month.total}일 근무
            </p>
          </Card>
        </div>
      </Band>
    </>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-canvas px-4 py-4">
      <p className="text-caption text-mid">{label}</p>
      <p className="mt-1 text-body font-semibold tabular-nums">{value}</p>
    </div>
  )
}

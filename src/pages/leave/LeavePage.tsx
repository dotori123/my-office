import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Leave } from '@/types'
import { useApp } from '@/store/AppContext'
import { useSeo } from '@/hooks/useSeo'
import { Badge, Band, Button, Card, ConfirmDialog, EmptyState, PageHero, ProgressBar, Stat, Tabs, cx } from '@/components/ui'
import { fmtShort, fmtFull, today, weekdayKo } from '@/utils/date'
import { accrualFor, nextRaise } from '@/utils/accrual'
import { fmtDays } from '@/utils/format'
import { leaveLabel, summarizeLeaves, yearEndOutcome } from '@/utils/leave'
import LeaveForm from './LeaveForm'
import LeaveRecommend from './LeaveRecommend'
import LeaveImport from './LeaveImport'

type Tab = 'status' | 'history' | 'recommend'
const TABS: { key: Tab; label: string }[] = [
  { key: 'status', label: '연차 현황' },
  { key: 'history', label: '사용 내역' },
  { key: 'recommend', label: '연차 추천' },
]

export default function LeavePage() {
  useSeo({
    title: '연차 — MY OFFICE',
    description: '총 연차·사용·예정·잔여를 한눈에. 반차·반반차까지 0.25일 단위로 계산하고, 공휴일과 이어 가장 길게 쉬는 날짜를 추천합니다.',
    path: '/leave',
  })
  const { state, dispatch } = useApp()
  const { leaves, settings } = state
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'status'
  const setTab = (t: Tab) => setParams(t === 'status' ? {} : { tab: t })

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Leave | null>(null)
  const [preset, setPreset] = useState<{ start: string; end: string } | undefined>()
  const [importOpen, setImportOpen] = useState(false)
  const [removing, setRemoving] = useState<Leave | null>(null)

  const summary = summarizeLeaves(leaves, settings.totalLeave)

  const openNew = (p?: { start: string; end: string }) => {
    setEditing(null)
    setPreset(p)
    setFormOpen(true)
  }
  const openEdit = (l: Leave) => {
    setEditing(l)
    setPreset(undefined)
    setFormOpen(true)
  }

  return (
    <>
      <Band inner="pb-8 pt-14 md:pb-10 md:pt-20">
        <PageHero
          eyebrow={`${settings.year}년`}
          title="연차"
          sub={`${fmtDays(summary.remaining)} 남았어요. 사용 ${fmtDays(summary.used)}, 예정 ${fmtDays(summary.planned)}.`}
          action={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setImportOpen(true)}>
                붙여넣기로 가져오기
              </Button>
              <Button onClick={() => openNew()}>연차 등록</Button>
            </div>
          }
        />
        <div className="mt-10 flex justify-center">
          <Tabs tabs={TABS} value={tab} onChange={setTab} />
        </div>
      </Band>

      <Band tone="gray">
        {tab === 'status' && (
          <StatusTab
            summary={summary}
            leaves={leaves}
            accrual={accrualFor(state.user.joinDate, settings.year)}
            raise={nextRaise(state.user.joinDate, settings.year)}
          />
        )}
        {tab === 'history' && (
          <HistoryTab leaves={leaves} onEdit={openEdit} onRemove={setRemoving} />
        )}
        {tab === 'recommend' && <LeaveRecommend remaining={summary.remaining} onApply={(s, e) => openNew({ start: s, end: e })} />}
      </Band>

      <LeaveImport open={importOpen} onClose={() => setImportOpen(false)} />
      <LeaveForm open={formOpen} onClose={() => setFormOpen(false)} initial={editing} presetDates={preset} />
      <ConfirmDialog
        open={removing !== null}
        title="연차 내역 삭제"
        message={removing && `${fmtShort(removing.startDate)} ${removing.type} 내역을 삭제할까요? 삭제한 내역은 되돌릴 수 없어요.`}
        onConfirm={() => removing && dispatch({ type: 'leave/remove', id: removing.id })}
        onClose={() => setRemoving(null)}
      />
    </>
  )
}

/* ---------- 연차 현황 ---------- */
function StatusTab({
  summary,
  leaves,
  accrual,
  raise,
}: {
  summary: ReturnType<typeof summarizeLeaves>
  leaves: Leave[]
  accrual: ReturnType<typeof accrualFor>
  raise: ReturnType<typeof nextRaise>
}) {
  const base = today()
  const outcome = yearEndOutcome(summary.remaining)
  const upcoming = leaves.filter((l) => l.startDate > base).sort((a, b) => a.startDate.localeCompare(b.startDate))

  const monthly = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const m = String(i + 1).padStart(2, '0')
        return leaves.filter((l) => l.startDate.slice(5, 7) === m).reduce((s, l) => s + l.amount, 0)
      }),
    [leaves],
  )
  const maxMonthly = Math.max(1, ...monthly)

  return (
    <div className="grid gap-5 md:grid-cols-5">
      {/* 총 연차는 프로필 설정에서 바꾼다 */}
      <Card className="md:col-span-3" eyebrow="잔여 연차">
        <div className="flex items-end justify-between">
          <p className="text-heading-sm font-bold tabular-nums md:text-heading-lg">{fmtDays(summary.remaining)}</p>
          <p className="text-body-sm text-mid">총 {fmtDays(summary.total)}</p>
        </div>
        <ProgressBar value={summary.usageRate} className="mt-6 h-2.5" />
        <p className="mt-2 text-right text-micro text-mid">사용률 {summary.usageRate}%</p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="사용" value={fmtDays(summary.used)} />
          <Stat label="예정" value={fmtDays(summary.planned)} />
          <Stat label="잔여" value={fmtDays(summary.remaining)} />
        </div>

        {/* 남은 연차는 연말에 일부만 수당이 되고 나머지는 소멸한다 */}
        {outcome.payout + outcome.expire > 0 && (
          <p className="mt-4 text-caption text-mid">
            연말까지 안 쓰면 <span className="text-ink">{fmtDays(outcome.payout)}은 수당</span>
            {outcome.expire > 0 ? (
              <>
                , <span className="font-medium text-ember">{fmtDays(outcome.expire)}은 소멸</span>돼요.
              </>
            ) : (
              <>로 받아요. (수당은 최대 {fmtDays(outcome.limit)})</>
            )}
          </p>
        )}
        {summary.familyDays > 0 && (
          <p className="mt-4 text-caption text-mid">경조휴가 {summary.familyDays}일은 연차와 별개라 여기에 포함하지 않았어요.</p>
        )}

        {/* 회계연도 기준이라 근속 3년을 넘겨도 가산은 다음 1/1 에 반영된다 */}
        {raise && (
          <p className="mt-4 text-caption text-mid">
            <span className="text-ink">{fmtFull(`${raise.year}-01-01`)}</span>에 {raise.days}일로 늘어요 · {raise.reason}
          </p>
        )}

        {/* 입사 1년 미만이면 연차가 매달 늘어난다 */}
        {accrual?.nextMonthlyDate && (
          <div className="mt-4 rounded-[16px] bg-canvas px-4 py-3">
            <p className="text-caption text-deep">
              입사 1년 미만이라 <span className="font-medium text-ink">매달 만근할 때마다 1일</span>씩 늘어요.
            </p>
            <p className="mt-1 text-micro text-mid">
              지금까지 월차 {accrual.monthly}일 · 다음 {fmtShort(accrual.nextMonthlyDate)}에 +1일
              {accrual.monthlyExpiresAt && ` · 입사 1주년 ${fmtFull(accrual.monthlyExpiresAt)}까지 써야 소멸되지 않아요`}
            </p>
          </div>
        )}
      </Card>

      <Card className="md:col-span-2" title="예정된 연차">
        {upcoming.length === 0 ? (
          <EmptyState text="예정된 연차가 없어요" />
        ) : (
          <ul className="space-y-2">
            {upcoming.map((l) => (
              <li key={l.id} className="flex items-center justify-between rounded-[16px] bg-citrus/50 px-4 py-3">
                <div>
                  <p className="text-body-sm font-medium">
                    {fmtShort(l.startDate)} ({weekdayKo(l.startDate)})
                    {l.endDate !== l.startDate && ` – ${fmtShort(l.endDate)}`}
                  </p>
                  <p className="text-caption text-deep">
                    {leaveLabel(l)}
                    {l.memo && ` · ${l.memo}`}
                  </p>
                </div>
                <span className="text-body-sm font-medium tabular-nums">
                  {l.type === '경조' ? <span className="text-caption font-normal text-mid">차감 없음</span> : `−${fmtDays(l.amount)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="md:col-span-5" title="월별 사용 현황">
        <div className="flex items-end gap-2">
          {monthly.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-micro text-mid tabular-nums">{v > 0 ? fmtDays(v).replace('일', '') : ''}</span>
              <div className="flex h-24 w-full items-end">
                <div className="w-full rounded-t-[6px] bg-ink" style={{ height: `${(v / maxMonthly) * 100}%` }} />
              </div>
              <span className="text-micro text-mid">{i + 1}월</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ---------- 사용 내역 ---------- */
function HistoryTab({ leaves, onEdit, onRemove }: { leaves: Leave[]; onEdit: (l: Leave) => void; onRemove: (l: Leave) => void }) {
  const base = today()
  const [filter, setFilter] = useState<'all' | Leave['type']>('all')
  const list = leaves.filter((l) => filter === 'all' || l.type === filter).sort((a, b) => b.startDate.localeCompare(a.startDate))

  const groups = useMemo(() => {
    const m = new Map<string, Leave[]>()
    for (const l of list) {
      const k = l.startDate.slice(0, 7)
      m.set(k, [...(m.get(k) ?? []), l])
    }
    return [...m.entries()]
  }, [list])

  return (
    <Card
      title="사용 내역"
      action={
        <div className="flex flex-wrap justify-end gap-1.5">
          {(['all', '연차', '반차', '반반차', '경조', '기타'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cx(
                'rounded-pill px-3 py-1 text-caption transition-colors',
                filter === f ? 'bg-ink text-paper' : 'bg-wash text-deep hover:bg-hairline',
              )}
            >
              {f === 'all' ? '전체' : f}
            </button>
          ))}
        </div>
      }
    >
      {groups.length === 0 ? (
        <EmptyState text="등록된 연차가 없어요" />
      ) : (
        <div className="space-y-8">
          {groups.map(([ym, items]) => (
            <div key={ym}>
              <p className="mb-3 text-caption text-mid">
                {ym.slice(0, 4)}년 {Number(ym.slice(5, 7))}월 · {fmtDays(items.reduce((s, l) => s + l.amount, 0))}
              </p>
              <ul className="divide-y divide-hairline/60 rounded-[20px] bg-canvas px-4">
                {items.map((l) => (
                  <li key={l.id} className="group flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3.5">
                    {/* 기간 연차는 두 날짜를 같은 굵기로 나란히, 요일은 묶어서 */}
                    <span className="shrink-0 whitespace-nowrap text-body-sm font-medium tabular-nums sm:w-[108px]">
                      {fmtShort(l.startDate)}
                      {l.endDate !== l.startDate && ` – ${fmtShort(l.endDate)}`}
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-caption text-mid sm:w-9">
                      {l.endDate !== l.startDate
                        ? `${weekdayKo(l.startDate)}·${weekdayKo(l.endDate)}`
                        : weekdayKo(l.startDate)}
                    </span>
                    <Badge className={l.type === '경조' ? 'bg-sky' : 'bg-citrus'}>{leaveLabel(l)}</Badge>
                    {l.startDate > base && <span className="text-micro font-medium text-ember">예정</span>}
                    {/* 좁은 화면에서는 메모를 아랫줄로 */}
                    <span className="order-last w-full truncate text-caption text-mid sm:order-none sm:w-auto sm:flex-1 sm:text-body-sm">
                      {l.memo}
                    </span>
                    <span className="ml-auto shrink-0 text-body-sm font-medium tabular-nums">
                      {l.type === '경조' ? <span className="text-caption font-normal text-mid">차감 없음</span> : `−${fmtDays(l.amount)}`}
                    </span>
                    <div className="flex shrink-0 gap-1 md:opacity-0 md:group-hover:opacity-100">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(l)}>
                        수정
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => onRemove(l)}>
                        삭제
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BENEFIT_CATEGORIES, type Benefit, type BenefitCategory } from '@/types'
import { useApp } from '@/store/AppContext'
import { useSeo } from '@/hooks/useSeo'
import { Badge, Band, Button, Card, ConfirmDialog, EmptyState, PageHero, ProgressBar, Stat, Tabs, cx } from '@/components/ui'
import { fmtShort, today } from '@/utils/date'
import { fmtWon } from '@/utils/format'
import { byCategory, monthlyBenefits, summarizeBenefits } from '@/utils/benefit'
import BenefitForm from './BenefitForm'
import BenefitImport from './BenefitImport'

type Tab = 'status' | 'history' | 'stats'
const TABS: { key: Tab; label: string }[] = [
  { key: 'status', label: '지원비 현황' },
  { key: 'history', label: '사용 내역' },
  { key: 'stats', label: '통계' },
]

// 카테고리 색 — product finish 파스텔. 직접 입력한 카테고리는 기본색을 쓴다
const CATEGORY_STYLE: Record<string, string> = {
  도서: 'bg-starlight',
  교육: 'bg-sky',
  소프트웨어: 'bg-silver',
  기타: 'bg-wash',
}
const catStyle = (c: string) => CATEGORY_STYLE[c] ?? 'bg-wash'

export default function BenefitPage() {
  useSeo({
    title: '지원비 — MY OFFICE',
    description: '도서·교육·소프트웨어 지원비를 한곳에서. 월별 사용액과 카테고리별 비중을 보여주고, 잔액을 자동으로 계산합니다.',
    path: '/benefit',
  })
  const { state, dispatch } = useApp()
  const { benefits, settings } = state
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'status'
  const setTab = (t: Tab) => setParams(t === 'status' ? {} : { tab: t })

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Benefit | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [removing, setRemoving] = useState<Benefit | null>(null)

  const summary = summarizeBenefits(benefits, settings.totalBenefit)

  return (
    <>
      <Band inner="pb-8 pt-14 md:pb-10 md:pt-20">
        <PageHero
          eyebrow="도서 · 교육 · 소프트웨어 통합"
          title="지원비"
          sub={`${fmtWon(summary.remaining)} 남았어요. 총 ${fmtWon(summary.total)} 중 ${summary.usageRate}% 사용.`}
          action={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setImportOpen(true)}>
                붙여넣기로 가져오기
              </Button>
              <Button
                onClick={() => {
                  setEditing(null)
                  setFormOpen(true)
                }}
              >
                사용 등록
              </Button>
            </div>
          }
        />
        <div className="mt-10 flex justify-center">
          <Tabs tabs={TABS} value={tab} onChange={setTab} />
        </div>
      </Band>

      <Band tone="gray">
        {tab === 'status' && <StatusTab summary={summary} benefits={benefits} />}
        {tab === 'history' && (
          <HistoryTab
            benefits={benefits}
            onEdit={(b) => {
              setEditing(b)
              setFormOpen(true)
            }}
            onRemove={setRemoving}
          />
        )}
        {tab === 'stats' && <StatsTab benefits={benefits} summary={summary} year={settings.year} />}
      </Band>

      <BenefitImport open={importOpen} onClose={() => setImportOpen(false)} />
      <BenefitForm open={formOpen} onClose={() => setFormOpen(false)} initial={editing} />
      <ConfirmDialog
        open={removing !== null}
        title="사용 내역 삭제"
        message={removing && `'${removing.name}' 내역을 삭제할까요? 삭제한 내역은 되돌릴 수 없어요.`}
        onConfirm={() => removing && dispatch({ type: 'benefit/remove', id: removing.id })}
        onClose={() => setRemoving(null)}
      />
    </>
  )
}

/* ---------- 현황 ---------- */
function StatusTab({ summary, benefits }: { summary: ReturnType<typeof summarizeBenefits>; benefits: Benefit[] }) {
  const recent = [...benefits].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)
  const over = summary.remaining < 0
  return (
    <div className="grid gap-5 md:grid-cols-5">
      {/* 총 지원금은 프로필 설정에서 바꾼다 */}
      <Card className="md:col-span-3" eyebrow="잔액">
        <div className="flex items-end justify-between">
          <p className={cx('text-heading-sm font-bold tabular-nums md:text-heading', over && 'text-ember')}>{fmtWon(summary.remaining)}</p>
          <p className="text-body-sm text-mid">총 {fmtWon(summary.total)}</p>
        </div>
        <ProgressBar value={summary.usageRate} color={over ? 'bg-ember' : 'bg-ink'} className="mt-6 h-2.5" />
        <p className="mt-2 text-right text-micro text-mid">사용률 {summary.usageRate}%</p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="총 지원금" value={fmtWon(summary.total)} />
          <Stat label="사용" value={fmtWon(summary.used)} />
          <Stat label="잔액" value={fmtWon(summary.remaining)} />
        </div>
        {over && <p className="mt-4 text-caption font-medium text-ember">지원금을 초과했어요.</p>}
      </Card>

      <Card className="md:col-span-2" title="최근 사용">
        {recent.length === 0 ? (
          <EmptyState text="사용 내역이 없어요" />
        ) : (
          <ul className="space-y-2">
            {recent.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 rounded-[16px] bg-canvas px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-body-sm font-medium">{b.name}</p>
                  <p className="text-caption text-mid">
                    {fmtShort(b.date)} · {b.category}
                  </p>
                </div>
                <span className="shrink-0 text-body-sm font-medium tabular-nums">{fmtWon(b.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

/* ---------- 사용 내역 ---------- */
function HistoryTab({ benefits, onEdit, onRemove }: { benefits: Benefit[]; onEdit: (b: Benefit) => void; onRemove: (b: Benefit) => void }) {
  const [filter, setFilter] = useState<'all' | BenefitCategory>('all')
  // 펼쳐 둔 합산 건
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const list = benefits.filter((b) => filter === 'all' || b.category === filter).sort((a, b) => b.date.localeCompare(a.date))
  // 기본 카테고리 + 실제로 쓰인 카테고리
  const categories = [...new Set([...BENEFIT_CATEGORIES, ...benefits.map((b) => b.category)])]

  const groups = useMemo(() => {
    const m = new Map<string, Benefit[]>()
    for (const b of list) m.set(b.date.slice(0, 7), [...(m.get(b.date.slice(0, 7)) ?? []), b])
    return [...m.entries()]
  }, [list])

  return (
    <Card
      title="사용 내역"
      action={
        <div className="flex flex-wrap justify-end gap-1.5">
          {(['all', ...categories] as const).map((f) => (
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
        <EmptyState text="사용 내역이 없어요" />
      ) : (
        <div className="space-y-8">
          {groups.map(([ym, items]) => (
            <div key={ym}>
              <p className="mb-3 text-caption text-mid">
                {ym.slice(0, 4)}년 {Number(ym.slice(5, 7))}월 · {fmtWon(items.reduce((s, b) => s + b.amount, 0))}
              </p>
              <ul className="divide-y divide-hairline/60 rounded-[20px] bg-canvas px-4">
                {items.map((b) => {
                  const parts = b.parts?.length ? b.parts : null
                  const isOpen = parts !== null && expanded.has(b.id)
                  return (
                    <li key={b.id} className="group flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3.5">
                      <span className="w-12 shrink-0 text-body-sm font-medium tabular-nums">{fmtShort(b.date)}</span>
                      <Badge className={catStyle(b.category)}>{b.category}</Badge>
                      {/* 좁은 화면에서는 항목명을 아랫줄로 */}
                      <div className="order-last w-full min-w-0 sm:order-none sm:w-auto sm:flex-1">
                        <p className="truncate text-body-sm">{b.name}</p>
                        {parts ? (
                          // 합산 건은 메모 자리가 원본 목록을 펼치는 토글이 된다
                          <button
                            type="button"
                            onClick={() => toggleExpand(b.id)}
                            aria-expanded={isOpen}
                            className="flex max-w-full items-center gap-1 text-caption text-mid transition-colors hover:text-ink"
                          >
                            <span className="truncate">{b.memo || `${parts.length}건 합산`}</span>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={cx('shrink-0 transition-transform', isOpen && 'rotate-180')}
                            >
                              <path d="M3 4.5l3 3 3-3" />
                            </svg>
                          </button>
                        ) : (
                          (b.memo || b.receipt) && (
                            <p className="truncate text-caption text-mid">
                              {b.memo}
                              {b.receipt && ` · 첨부 ${b.receipt}`}
                            </p>
                          )
                        )}
                      </div>
                      <span className="ml-auto shrink-0 text-body-sm font-medium tabular-nums">{fmtWon(b.amount)}</span>
                      <div className="flex shrink-0 gap-1 md:opacity-0 md:group-hover:opacity-100">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(b)}>
                          수정
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => onRemove(b)}>
                          삭제
                        </Button>
                      </div>
                      {isOpen && (
                        <ul className="order-last mb-1 mt-1 w-full space-y-1.5 border-l border-hairline pl-4 sm:ml-[60px]">
                          {parts.map((p, i) => (
                            <li key={i} className="flex items-center gap-3 text-caption text-mid">
                              <span className="w-10 shrink-0 tabular-nums">{fmtShort(p.date)}</span>
                              <span className="min-w-0 flex-1 truncate">{p.name}</span>
                              <span className="shrink-0 tabular-nums">{fmtWon(p.amount)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

/* ---------- 통계 ---------- */
function StatsTab({ benefits, summary, year }: { benefits: Benefit[]; summary: ReturnType<typeof summarizeBenefits>; year: number }) {
  const monthly = monthlyBenefits(benefits, year)
  const max = Math.max(1, ...monthly.map((m) => m.amount))
  const currentMonth = Number(today().slice(5, 7))
  const avg = Math.round(summary.used / currentMonth)
  const cats = byCategory(benefits)

  return (
    <div className="grid gap-5 md:grid-cols-5">
      <Card className="md:col-span-5" title={`${year}년 월별 사용액`}>
        <div className="flex items-end gap-1.5 sm:gap-2">
          {monthly.map((m) => (
            <div key={m.month} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="hidden text-micro text-mid tabular-nums sm:block">{m.amount > 0 ? `${Math.round(m.amount / 1000)}k` : ''}</span>
              <div className="flex h-36 w-full items-end">
                <div
                  className={cx('w-full rounded-t-[6px]', m.month === currentMonth ? 'bg-ink' : 'bg-hairline')}
                  style={{ height: `${(m.amount / max) * 100}%` }}
                  title={fmtWon(m.amount)}
                />
              </div>
              <span className="text-micro text-mid">{m.month}월</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:col-span-2 md:grid-cols-1">
        <Stat label="총 사용액" value={fmtWon(summary.used)} className="bg-paper" />
        <Stat label="잔액" value={fmtWon(summary.remaining)} className="bg-paper" />
        <Stat label="사용률" value={`${summary.usageRate}%`} className="bg-paper" />
        <Stat label="월 평균 사용액" value={fmtWon(avg)} sub={`1월 – ${currentMonth}월 기준`} className="bg-paper" />
      </div>

      <Card className="md:col-span-3" title="카테고리별 사용액">
        {cats.length === 0 ? (
          <EmptyState text="데이터가 없어요" />
        ) : (
          <ul className="space-y-4">
            {cats.map((c) => (
              <li key={c.category}>
                <div className="mb-1.5 flex items-center justify-between text-body-sm">
                  <Badge className={catStyle(c.category)}>{c.category}</Badge>
                  <span className="font-medium tabular-nums">
                    {fmtWon(c.amount)} <span className="text-caption font-normal text-mid">({Math.round((c.amount / summary.used) * 100)}%)</span>
                  </span>
                </div>
                <ProgressBar value={(c.amount / summary.used) * 100} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

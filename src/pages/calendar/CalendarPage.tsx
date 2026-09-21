import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CalendarEvent } from '@/types'
import { useApp } from '@/store/AppContext'
import { ArrowLink, Band, Button, Card, EmptyState, Field, Input, Modal, PageHero, cx } from '@/components/ui'
import { HOLIDAYS_2026 } from '@/data/holidays'
import { addDays, fmtKo, fromKey, isWeekend, monthGrid, today, weekdayKo } from '@/utils/date'
import { recommendLeaves, summarizeLeaves } from '@/utils/leave'
import { EVENT_STYLE, type UnifiedEvent } from './eventStyle'

const WEEK_HEADER = ['월', '화', '수', '목', '금', '토', '일']

export default function CalendarPage() {
  const { state, dispatch } = useApp()
  const { leaves, events, settings } = state
  const base = today()
  const [year, setYear] = useState(Number(base.slice(0, 4)))
  const [month, setMonth] = useState(Number(base.slice(5, 7)) - 1)
  const [selected, setSelected] = useState(base)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [showRecommend, setShowRecommend] = useState(true)

  const move = (delta: number) => {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }
  const goToday = () => {
    setYear(Number(base.slice(0, 4)))
    setMonth(Number(base.slice(5, 7)) - 1)
    setSelected(base)
  }

  // 날짜별 일정 맵
  const eventMap = useMemo(() => {
    const map = new Map<string, UnifiedEvent[]>()
    const push = (e: UnifiedEvent) => map.set(e.date, [...(map.get(e.date) ?? []), e])
    HOLIDAYS_2026.forEach((h) => push({ id: `h-${h.date}`, date: h.date, title: h.name, type: 'holiday' }))
    leaves.forEach((l) => {
      for (let cur = l.startDate; cur <= l.endDate; cur = addDays(cur, 1)) {
        push({ id: l.id, date: cur, title: l.type, type: 'leave', memo: l.memo })
      }
    })
    events.forEach((e) => push({ id: e.id, date: e.date, title: e.title, type: e.type, memo: e.memo }))
    return map
  }, [leaves, events])

  // 추천 연차 (상위 3개) 표시
  const recommendDates = useMemo(() => {
    if (!showRecommend) return new Set<string>()
    const { remaining } = summarizeLeaves(leaves, settings.totalLeave)
    return new Set(recommendLeaves(leaves, events, { useDays: 1, remaining }).slice(0, 3).flatMap((r) => r.dates))
  }, [leaves, events, settings.totalLeave, showRecommend])

  const grid = monthGrid(year, month)
  const selectedEvents = eventMap.get(selected) ?? []

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const navBtn = 'flex size-9 items-center justify-center rounded-full bg-wash text-deep hover:bg-hairline'

  return (
    <>
      <Band inner="pb-8 pt-14 md:pb-10 md:pt-20">
        <PageHero eyebrow="공휴일 · 연차 · 회사 일정 · 개인 일정" title="Calendar" action={<Button onClick={openNew}>일정 등록</Button>} />
      </Band>

      <Band tone="gray">
        <div className="grid gap-5 lg:grid-cols-3">
          {/* 달력 */}
          <Card className="lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-body-lg font-semibold">
                {year}년 {month + 1}월
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => move(-1)} className={navBtn} aria-label="이전 달">
                  ‹
                </button>
                <button type="button" onClick={goToday} className="rounded-pill bg-wash px-4 py-1.5 text-caption text-deep hover:bg-hairline">
                  오늘
                </button>
                <button type="button" onClick={() => move(1)} className={navBtn} aria-label="다음 달">
                  ›
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center text-micro text-mid">
              {WEEK_HEADER.map((w) => (
                <div key={w} className="py-1.5">
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map(({ key, inMonth }) => {
                const evs = eventMap.get(key) ?? []
                const isToday = key === base
                const isSel = key === selected
                const dow = fromKey(key).getDay()
                const rec = recommendDates.has(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelected(key)}
                    className={cx(
                      'flex min-h-16 flex-col items-start rounded-[12px] p-1.5 text-left transition-colors sm:min-h-20',
                      !inMonth && 'opacity-30',
                      isSel ? 'bg-wash' : 'hover:bg-canvas',
                    )}
                  >
                    <span
                      className={cx(
                        'flex size-6 items-center justify-center rounded-full text-caption tabular-nums',
                        isToday ? 'bg-ink font-medium text-paper' : dow === 0 || dow === 6 ? 'text-mid' : 'text-ink',
                      )}
                    >
                      {Number(key.slice(8))}
                    </span>
                    <div className="mt-1 w-full space-y-0.5">
                      {evs.slice(0, 2).map((e) => (
                        <p key={`${e.type}-${e.id}`} className={cx('truncate rounded-[6px] px-1.5 text-[10px] leading-4 sm:text-[11px]', EVENT_STYLE[e.type].chip)}>
                          {e.title}
                        </p>
                      ))}
                      {evs.length > 2 && <p className="px-1.5 text-[10px] text-mid">+{evs.length - 2}</p>}
                      {rec && evs.length === 0 && <p className="truncate px-1.5 text-[10px] font-medium leading-4 text-ember sm:text-[11px]">추천</p>}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-caption text-mid">
              {(Object.keys(EVENT_STYLE) as (keyof typeof EVENT_STYLE)[]).map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <span className={cx('size-2.5 rounded-full', EVENT_STYLE[t].dot)} /> {EVENT_STYLE[t].label}
                </span>
              ))}
              <label className="ml-auto flex items-center gap-1.5">
                <input type="checkbox" className="size-3.5 accent-blue" checked={showRecommend} onChange={(e) => setShowRecommend(e.target.checked)} />
                연차 추천 표시
              </label>
            </div>
          </Card>

          {/* 선택 날짜 */}
          <Card
            eyebrow={isWeekend(selected) ? '주말' : recommendDates.has(selected) ? '연차 추천일' : undefined}
            title={fmtKo(selected)}
            action={recommendDates.has(selected) && <ArrowLink to="/leave?tab=recommend">추천 보기</ArrowLink>}
          >
            {selectedEvents.length === 0 ? (
              <EmptyState text="일정이 없어요" />
            ) : (
              <ul className="space-y-2">
                {selectedEvents.map((e) => {
                  const s = EVENT_STYLE[e.type]
                  const editable = e.type === 'personal' || e.type === 'company'
                  const raw = editable ? events.find((x) => x.id === e.id) : undefined
                  return (
                    <li key={`${e.type}-${e.id}`} className="flex items-start gap-3 rounded-[16px] bg-canvas px-4 py-3">
                      <span className={cx('mt-2 size-2.5 shrink-0 rounded-full', s.dot)} />
                      <div className="min-w-0 flex-1">
                        <p className="text-body-sm font-medium">{e.title}</p>
                        <p className="text-caption text-mid">
                          {s.label}
                          {raw?.dayOff && ' · 휴무'}
                          {e.memo && ` · ${e.memo}`}
                        </p>
                      </div>
                      {e.type === 'leave' && (
                        <Link to="/leave?tab=history" className="text-caption text-link hover:underline">
                          관리
                        </Link>
                      )}
                      {raw && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setEditing(raw); setFormOpen(true) }}>
                            수정
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => dispatch({ type: 'event/remove', id: raw.id })}>
                            삭제
                          </Button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
            <Button variant="secondary" className="mt-5 w-full" onClick={openNew}>
              {fmtKo(selected)} 일정 추가
            </Button>
          </Card>
        </div>
      </Band>

      <EventForm open={formOpen} onClose={() => setFormOpen(false)} initial={editing} defaultDate={selected} />
    </>
  )
}

/* ---------- 일정 등록/수정 ---------- */
function EventForm({ open, onClose, initial, defaultDate }: { open: boolean; onClose: () => void; initial: CalendarEvent | null; defaultDate: string }) {
  const { dispatch } = useApp()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [type, setType] = useState<'personal' | 'company'>('personal')
  const [dayOff, setDayOff] = useState(false)
  const [memo, setMemo] = useState('')

  useEffect(() => {
    if (!open) return
    setTitle(initial?.title ?? '')
    setDate(initial?.date ?? defaultDate)
    setType(initial?.type === 'company' ? 'company' : 'personal')
    setDayOff(initial?.dayOff ?? false)
    setMemo(initial?.memo ?? '')
  }, [open, initial, defaultDate])

  const submit = () => {
    const payload = { title: title.trim(), date, type, memo: memo.trim() || undefined, dayOff: type === 'company' ? dayOff : undefined }
    if (initial) dispatch({ type: 'event/update', payload: { ...initial, ...payload } })
    else dispatch({ type: 'event/add', payload })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? '일정 수정' : '일정 등록'}>
      <div className="space-y-5">
        <Field label="구분">
          <div className="grid grid-cols-2 gap-2">
            {(['personal', 'company'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cx(
                  'flex items-center justify-center gap-2 rounded-pill px-3 py-2 text-caption transition-colors',
                  type === t ? 'bg-ink text-paper' : 'bg-wash text-deep hover:bg-hairline',
                )}
              >
                <span className={cx('size-2.5 rounded-full', EVENT_STYLE[t].dot)} />
                {EVENT_STYLE[t].label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="제목">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="날짜" hint={`${weekdayKo(date)}요일`}>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {type === 'company' && (
          <label className="flex items-center gap-2 text-body-sm">
            <input type="checkbox" className="size-4 accent-blue" checked={dayOff} onChange={(e) => setDayOff(e.target.checked)} />
            회사 휴무일 (연차 추천 계산에 반영)
          </label>
        )}
        <Field label="메모">
          <Input placeholder="선택" value={memo} onChange={(e) => setMemo(e.target.value)} />
        </Field>
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button className="flex-1" onClick={submit} disabled={!title.trim() || !date}>
            {initial ? '저장' : '등록'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

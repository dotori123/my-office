import { useMemo, useState } from 'react'
import { useApp } from '@/store/AppContext'
import { Button, Card, EmptyState, Field, Input, cx } from '@/components/ui'
import { addDays, fmtKo, fmtShort, today, weekdayKo } from '@/utils/date'
import { fmtDays } from '@/utils/format'
import { recommendLeaves } from '@/utils/leave'

const USE_OPTIONS = [
  { key: 1, label: '연차 1일' },
  { key: 2, label: '연차 2일' },
  { key: 3, label: '연차 3일' },
  { key: 'max', label: '가장 긴 휴식' },
] as const

export default function LeaveRecommend({ remaining, onApply }: { remaining: number; onApply: (start: string, end: string) => void }) {
  const { state } = useApp()
  const [useDays, setUseDays] = useState<number | 'max'>(1)
  const [from, setFrom] = useState(addDays(today(), 1))
  const [to, setTo] = useState(`${today().slice(0, 4)}-12-31`)
  const [excludeOn, setExcludeOn] = useState(false)
  const [exFrom, setExFrom] = useState('')
  const [exTo, setExTo] = useState('')

  const results = useMemo(
    () =>
      recommendLeaves(state.leaves, state.events, {
        useDays,
        remaining,
        from,
        to,
        exclude: excludeOn && exFrom && exTo ? { from: exFrom, to: exTo } : undefined,
      }),
    [state.leaves, state.events, useDays, remaining, from, to, excludeOn, exFrom, exTo],
  )

  const best = results[0]

  return (
    <div className="grid gap-5 md:grid-cols-5">
      {/* 조건 */}
      <Card className="md:col-span-2" title="추천 조건">
        <div className="space-y-5">
          <Field label="사용할 연차">
            <div className="flex flex-wrap gap-2">
              {USE_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setUseDays(o.key)}
                  className={cx(
                    'rounded-pill px-4 py-2 text-caption transition-colors',
                    useDays === o.key ? 'bg-ink text-paper' : 'bg-wash text-deep hover:bg-hairline',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="검색 시작">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="검색 종료">
              <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-body-sm">
            <input type="checkbox" className="size-4 accent-blue" checked={excludeOn} onChange={(e) => setExcludeOn(e.target.checked)} />
            특정 기간 제외
          </label>
          {excludeOn && (
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={exFrom} onChange={(e) => setExFrom(e.target.value)} />
              <Input type="date" value={exTo} min={exFrom} onChange={(e) => setExTo(e.target.value)} />
            </div>
          )}

          <p className="rounded-[16px] bg-canvas px-4 py-3 text-caption text-mid">
            잔여 연차 <span className="text-ink">{fmtDays(remaining)}</span> 이내에서 공휴일·주말·회사 휴무일과 이어지는 날짜를 찾습니다.
          </p>
        </div>
      </Card>

      {/* 결과 */}
      <div className="space-y-5 md:col-span-3">
        {!best ? (
          <Card>
            <EmptyState
              text={
                state.settings.totalLeave === 0
                  ? "'내 정보'에서 총 연차를 먼저 입력해 주세요"
                  : remaining < 1
                    ? '잔여 연차가 부족해요'
                    : '조건에 맞는 추천이 없어요'
              }
            />
          </Card>
        ) : (
          <>
            <Card>
              <p className="text-micro font-medium text-ember">추천</p>
              <p className="mt-2 text-subheading font-semibold md:text-heading-sm">
                {best.dates.length === 1 ? fmtKo(best.dates[0]) : `${fmtKo(best.dates[0])} – ${fmtKo(best.dates[best.dates.length - 1])}`}에
                <br />
                연차를 사용하면
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-[16px] bg-canvas p-4">
                  <p className="text-caption text-mid">휴식 기간</p>
                  <p className="mt-1 text-body-sm font-medium">
                    {fmtShort(best.restStart)} – {fmtShort(best.restEnd)}
                  </p>
                </div>
                <div className="rounded-[16px] bg-canvas p-4">
                  <p className="text-caption text-mid">연속 휴식</p>
                  <p className="mt-1 text-body-sm font-medium">{best.restDays}일</p>
                </div>
                <div className="rounded-[16px] bg-canvas p-4">
                  <p className="text-caption text-mid">사용 연차</p>
                  <p className="mt-1 text-body-sm font-medium">{best.useDays}일</p>
                </div>
              </div>
              <p className="mt-4 text-body-sm text-mid">{best.reason}</p>
              <Button className="mt-5" onClick={() => onApply(best.dates[0], best.dates[best.dates.length - 1])}>
                이 날짜로 연차 등록
              </Button>
            </Card>

            <Card title="추천 목록">
              <ul className="divide-y divide-hairline/60">
                {results.map((r, i) => (
                  <li key={r.dates.join()} className="flex items-center gap-4 py-3.5">
                    <span className="w-6 shrink-0 text-caption text-mid tabular-nums">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-body-sm font-medium">
                        {r.dates.map((d) => `${fmtShort(d)}(${weekdayKo(d)})`).join(', ')}
                        <span className="ml-2 font-normal text-mid">연차 {r.useDays}일</span>
                      </p>
                      <p className="truncate text-caption text-mid">
                        {fmtShort(r.restStart)} – {fmtShort(r.restEnd)} · {r.reason}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-pill bg-wash px-3 py-1 text-caption font-medium tabular-nums">{r.restDays}일 휴식</span>
                    <Button variant="ghost" size="sm" onClick={() => onApply(r.dates[0], r.dates[r.dates.length - 1])}>
                      등록
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

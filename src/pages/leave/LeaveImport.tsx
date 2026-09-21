import { useEffect, useMemo, useState } from 'react'
import type { Leave } from '@/types'
import { useApp } from '@/store/AppContext'
import { Badge, Button, Modal, cx } from '@/components/ui'
import { buildDayOffContext, countWorkingDays, fmtShort, weekdayKo } from '@/utils/date'
import { fmtDays } from '@/utils/format'
import { DEFAULT_AMOUNT, looksLikeApprovalDocList, parseLeaves, type ParsedLeave } from '@/utils/parseLeaves'

const PLACEHOLDER = `근태 > 연차 사용내역 화면의 표를 드래그해서 복사한 뒤 그대로 붙여넣으세요.

예)
2026-09-18  연차  연차  사용  -1    2026-10-02 ~ 2026-10-02  개인사유
2026-01-02  연차        추가  +15   2026-12-31`

/** 이미 등록된 건과 같은 건인지 판단하는 값 */
const signature = (l: { startDate: string; endDate: string; type: string; amount: number; memo?: string }) =>
  `${l.startDate}|${l.endDate}|${l.type}|${l.amount}|${l.memo ?? ''}`

export default function LeaveImport({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useApp()
  const { leaves, events, settings } = state

  const [text, setText] = useState('')
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [applyGrant, setApplyGrant] = useState(false)

  useEffect(() => {
    if (!open) return
    setText('')
    setExcluded(new Set())
    setApplyGrant(false)
  }, [open])

  const ctx = useMemo(() => buildDayOffContext(leaves, events), [leaves, events])
  const existing = useMemo(() => new Set(leaves.map(signature)), [leaves])

  /** 파싱 결과에 차감 일수와 중복 여부를 채운다 */
  const parsed = useMemo(() => {
    const { rows, skipped, structured, grant } = parseLeaves(text, settings.year)
    const items = rows.map((r) => {
      const amount = r.amount ?? resolveAmount(r, ctx)
      return { ...r, amount, duplicate: existing.has(signature({ ...r, amount })) }
    })
    return { items, skipped, structured, grant }
  }, [text, settings.year, ctx, existing])

  // 표로 인식되지 않았는데 결재 문서함 목록처럼 보이면 경고
  const approvalDocList = text.trim().length > 0 && !parsed.structured && looksLikeApprovalDocList(text)

  const isOn = (row: (typeof parsed.items)[number]) => !row.duplicate && !row.cancelled && !excluded.has(row.key)
  const selected = parsed.items.filter(isOn)
  const totalDays = selected.reduce((s, r) => s + r.amount, 0)
  const showGrant = parsed.grant.count > 0 && parsed.grant.total > 0

  const toggle = (key: string) =>
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const submit = () => {
    const payload: Omit<Leave, 'id' | 'userId'>[] = selected.map((r) => ({
      type: r.type,
      startDate: r.startDate,
      endDate: r.endDate,
      amount: r.amount,
      memo: r.memo,
    }))
    if (payload.length) dispatch({ type: 'leave/import', payload })
    if (showGrant && applyGrant) dispatch({ type: 'settings/update', payload: { totalLeave: parsed.grant.total } })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="붙여넣기로 가져오기">
      <div className="space-y-5">
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={6}
            className="w-full resize-y rounded-[12px] border border-hairline bg-paper px-4 py-3 text-caption leading-relaxed text-ink outline-none placeholder:text-mid focus:border-ink focus:ring-2 focus:ring-ink/10"
          />
          <p className="mt-1.5 text-micro text-mid">
            '사용' 행만 연차로 가져옵니다. 날짜는 신청일이 아니라 사용기간을 기준으로 해요.
          </p>
        </div>

        {approvalDocList && (
          <div className="rounded-[16px] bg-canvas px-4 py-3">
            <p className="text-caption font-medium text-ember">전자결재 문서 목록으로 보여요</p>
            <p className="mt-1 text-micro leading-relaxed text-deep">
              이 목록의 날짜는 기안일·완료일(결재 날짜)이라 실제 휴가 날짜가 아닙니다. 그대로 가져오면 엉뚱한 날짜로 등록돼요. 근태 메뉴의{' '}
              <b>연차 사용내역</b> 화면을 붙여넣어 주세요.
            </p>
          </div>
        )}

        {text.trim() && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-caption text-deep">
                미리보기 <span className="text-mid">{parsed.items.length}건 인식</span>
              </p>
              {selected.length > 0 && (
                <p className="text-caption text-mid">
                  가져올 {selected.length}건 · {fmtDays(totalDays)}
                </p>
              )}
            </div>

            {parsed.items.length === 0 ? (
              <p className="rounded-[16px] bg-canvas px-4 py-6 text-center text-caption text-mid">인식된 날짜가 없어요</p>
            ) : (
              <ul className="max-h-56 divide-y divide-hairline/60 overflow-y-auto rounded-[16px] bg-canvas px-4">
                {parsed.items.map((r) => {
                  const on = isOn(r)
                  const note = r.cancelled ? '취소된 건' : r.duplicate ? '이미 등록됨' : r.memo
                  return (
                    <li key={r.key} className={cx('flex items-center gap-2.5 py-2.5', !on && 'opacity-40')}>
                      <input
                        type="checkbox"
                        className="size-4 shrink-0 accent-blue"
                        checked={on}
                        disabled={r.duplicate || r.cancelled}
                        onChange={() => toggle(r.key)}
                      />
                      <span className="w-[86px] shrink-0 whitespace-nowrap text-caption font-medium tabular-nums">
                        {fmtShort(r.startDate)}
                        {r.endDate !== r.startDate && ` – ${fmtShort(r.endDate)}`}
                      </span>
                      <span className="w-7 shrink-0 whitespace-nowrap text-micro text-mid">
                        {r.endDate !== r.startDate
                          ? `${weekdayKo(r.startDate)}·${weekdayKo(r.endDate)}`
                          : weekdayKo(r.startDate)}
                      </span>
                      <Badge className="bg-citrus">{r.type}</Badge>
                      <span className="min-w-0 flex-1 truncate text-micro text-mid">{note}</span>
                      <span className="shrink-0 text-caption tabular-nums">−{fmtDays(r.amount)}</span>
                    </li>
                  )
                })}
              </ul>
            )}

            {showGrant && (
              <label className="mt-3 flex items-start gap-2 rounded-[16px] bg-canvas px-4 py-3">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 accent-blue"
                  checked={applyGrant}
                  onChange={(e) => setApplyGrant(e.target.checked)}
                />
                <span className="text-micro leading-relaxed text-deep">
                  부여·조정 {parsed.grant.count}건이 있어요. 합계 <b>{fmtDays(parsed.grant.total)}</b>을 {settings.year}년 총 연차로 설정할까요?
                  <span className="mt-0.5 block text-mid">
                    현재 설정값 {fmtDays(settings.totalLeave)}. 맞지 않으면 체크를 풀고 '내 정보'에서 직접 입력하세요.
                  </span>
                </span>
              </label>
            )}

            {parsed.skipped.length > 0 && (
              <p className="mt-2 truncate text-micro text-ember">
                날짜를 찾지 못한 줄 {parsed.skipped.length}개는 건너뜁니다 — “{parsed.skipped[0]}”
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button className="flex-1" onClick={submit} disabled={selected.length === 0 && !(showGrant && applyGrant)}>
            {selected.length > 0 ? `${selected.length}건 가져오기` : '가져오기'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/** 일수가 적혀 있지 않을 때: 하루면 유형 기본값, 기간이면 근무일 수 */
function resolveAmount(r: ParsedLeave, ctx: ReturnType<typeof buildDayOffContext>) {
  if (r.startDate === r.endDate) return DEFAULT_AMOUNT[r.type]
  return Math.max(1, countWorkingDays(r.startDate, r.endDate, ctx)) * DEFAULT_AMOUNT[r.type]
}

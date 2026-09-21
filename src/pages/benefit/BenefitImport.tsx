import { useEffect, useMemo, useState } from 'react'
import type { Benefit, BenefitCategory } from '@/types'
import { useApp } from '@/store/AppContext'
import { Badge, Button, Modal, cx } from '@/components/ui'
import { fmtShort, weekdayKo } from '@/utils/date'
import { fmtWon } from '@/utils/format'
import { parseBenefits } from '@/utils/parseBenefits'

const PLACEHOLDER = `카드 사용내역이나 지출결의서 목록을 복사해서 붙여넣으세요.

예)
2026-09-02  IntelliJ  149,000  소프트웨어
2026-09-10  교육비  42,000원  교육  UX 라이팅 워크숍
09.15  타입스크립트 프로그래밍  19,000`

const CATEGORY_STYLE: Record<BenefitCategory, string> = {
  도서: 'bg-starlight',
  교육: 'bg-sky',
  소프트웨어: 'bg-silver',
  기타: 'bg-wash',
}

/** 이미 등록된 건과 같은 건인지 판단하는 값 */
const signature = (b: { date: string; name: string; amount: number }) => `${b.date}|${b.name}|${b.amount}`

export default function BenefitImport({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useApp()
  const { benefits, settings } = state

  const [text, setText] = useState('')
  const [excluded, setExcluded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    setText('')
    setExcluded(new Set())
  }, [open])

  const existing = useMemo(() => new Set(benefits.map(signature)), [benefits])

  const parsed = useMemo(() => {
    const { rows, skipped } = parseBenefits(text, settings.year)
    return { items: rows.map((r) => ({ ...r, duplicate: existing.has(signature(r)) })), skipped }
  }, [text, settings.year, existing])

  const isOn = (row: (typeof parsed.items)[number]) => !row.duplicate && !excluded.has(row.key)
  const selected = parsed.items.filter(isOn)
  const totalAmount = selected.reduce((s, r) => s + r.amount, 0)

  const toggle = (key: string) =>
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const submit = () => {
    const payload: Omit<Benefit, 'id' | 'userId'>[] = selected.map((r) => ({
      date: r.date,
      name: r.name,
      amount: r.amount,
      category: r.category,
      memo: r.memo,
    }))
    if (payload.length) dispatch({ type: 'benefit/import', payload })
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
            날짜와 금액이 있는 줄만 가져옵니다. 카테고리는 항목명에서 자동으로 추정하고, 가져온 뒤 수정할 수 있어요.
          </p>
        </div>

        {text.trim() && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-caption text-deep">
                미리보기 <span className="text-mid">{parsed.items.length}건 인식</span>
              </p>
              {selected.length > 0 && (
                <p className="text-caption text-mid">
                  가져올 {selected.length}건 · {fmtWon(totalAmount)}
                </p>
              )}
            </div>

            {parsed.items.length === 0 ? (
              <p className="rounded-[16px] bg-canvas px-4 py-6 text-center text-caption text-mid">인식된 내역이 없어요</p>
            ) : (
              <ul className="max-h-56 divide-y divide-hairline/60 overflow-y-auto rounded-[16px] bg-canvas px-4">
                {parsed.items.map((r) => {
                  const on = isOn(r)
                  return (
                    <li key={r.key} className={cx('flex items-center gap-2.5 py-2.5', !on && 'opacity-40')}>
                      <input
                        type="checkbox"
                        className="size-4 shrink-0 accent-blue"
                        checked={on}
                        disabled={r.duplicate}
                        onChange={() => toggle(r.key)}
                      />
                      <span className="w-11 shrink-0 text-caption font-medium tabular-nums">{fmtShort(r.date)}</span>
                      <span className="w-4 shrink-0 text-micro text-mid">{weekdayKo(r.date)}</span>
                      <Badge className={CATEGORY_STYLE[r.category]}>{r.category}</Badge>
                      <span className="min-w-0 flex-1 truncate text-micro text-ink">
                        {r.duplicate ? <span className="text-mid">이미 등록됨</span> : r.name}
                      </span>
                      <span className="shrink-0 text-caption tabular-nums">{fmtWon(r.amount)}</span>
                    </li>
                  )
                })}
              </ul>
            )}

            {parsed.skipped.length > 0 && (
              <p className="mt-2 truncate text-micro text-ember">
                날짜·금액을 찾지 못한 줄 {parsed.skipped.length}개는 건너뜁니다 — “{parsed.skipped[0]}”
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button className="flex-1" onClick={submit} disabled={selected.length === 0}>
            {selected.length > 0 ? `${selected.length}건 가져오기` : '가져오기'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

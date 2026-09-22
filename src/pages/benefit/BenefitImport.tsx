import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type DragEvent } from 'react'
import type { Benefit, BenefitPart } from '@/types'
import { useApp } from '@/store/AppContext'
import { Badge, Button, Modal, cx } from '@/components/ui'
import { fmtShort, weekdayKo } from '@/utils/date'
import { fmtWon } from '@/utils/format'
import { parseBenefits, type ParsedBenefit } from '@/utils/parseBenefits'
import { recognizeImage } from '@/utils/ocr'

const PLACEHOLDER = `카드 사용내역이나 지출결의서 목록을 복사해서 붙여넣으세요.
지출결의서를 캡처한 이미지를 붙여넣거나 끌어다 놓아도 됩니다.

예)
2026-09-02  IntelliJ  149,000  소프트웨어
2026-09-10  교육비  42,000원  교육  UX 라이팅 워크숍
09.15  타입스크립트 프로그래밍  19,000`

const CATEGORY_STYLE: Record<string, string> = {
  도서: 'bg-starlight',
  교육: 'bg-sky',
  소프트웨어: 'bg-silver',
  자격증: 'bg-blush',
  기타: 'bg-wash',
}
const catStyle = (c: string) => CATEGORY_STYLE[c] ?? 'bg-wash'

/** 이미 등록된 건과 같은 건인지 판단하는 값 */
const signature = (b: { date: string; name: string; amount: number }) => `${b.date}|${b.name}|${b.amount}`

/** 'Claude Pro 1개월 구독' 에서 1 을 꺼낸다 */
const monthsIn = (name: string) => {
  const m = name.match(/(\d+)\s*개월/)
  return m ? Number(m[1]) : null
}

/**
 * 항목명이 같은 건을 하나로 합친다.
 * 금액은 더하고, 이름에 '개월' 이 있으면 개월 수도 더해서 이름을 바꾼다.
 * (예: 1개월 구독 5건 → 5개월 구독)
 * 원본 건들은 parts 에 남겨서 내역에서 펼쳐 볼 수 있게 한다.
 */
function mergeSameName<T extends ParsedBenefit>(rows: T[], approvalDate?: string): (T & { parts?: BenefitPart[] })[] {
  const groups = new Map<string, T[]>()
  for (const r of rows) {
    const key = r.name.trim()
    groups.set(key, [...(groups.get(key) ?? []), r])
  }

  return [...groups.values()].map((group) => {
    if (group.length === 1) return group[0]

    const sorted = [...group].sort((a, b) => a.date.localeCompare(b.date))
    const amount = group.reduce((s, r) => s + r.amount, 0)
    const months = group.map((r) => monthsIn(r.name))
    const name = months.every((m) => m !== null)
      ? sorted[0].name.replace(/\d+\s*개월/, `${months.reduce((s, m) => s + (m as number), 0)}개월`)
      : sorted[0].name

    const last = sorted[sorted.length - 1]
    return {
      ...sorted[0],
      name,
      amount,
      // 결재일이 있으면 그 날짜로, 없으면 마지막 지출일로
      date: approvalDate ?? last.date,
      memo: `${fmtShort(sorted[0].date)} – ${fmtShort(last.date)} · ${group.length}건 합산`,
      parts: sorted.map(({ date, name, amount }) => ({ date, name, amount })),
    }
  })
}

export default function BenefitImport({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useApp()
  const { benefits, settings } = state

  const [text, setText] = useState('')
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [merge, setMerge] = useState(false)
  /** 결재일이 있으면 지출일 대신 결재일로 등록 */
  const [useApproval, setUseApproval] = useState(true)
  const [ocr, setOcr] = useState<{ busy: boolean; error?: string }>({ busy: false })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setText('')
    setExcluded(new Set())
    setMerge(false)
    setUseApproval(true)
    setOcr({ busy: false })
  }, [open])

  /** 이미지에서 글자를 읽어 입력창 끝에 붙인다 */
  const readImages = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'))
    if (!images.length) return
    setOcr({ busy: true })
    try {
      const texts = await Promise.all(images.map(recognizeImage))
      setText((prev) => [prev.trim(), ...texts].filter(Boolean).join('\n'))
      setOcr({ busy: false })
    } catch (e) {
      setOcr({ busy: false, error: e instanceof Error ? e.message : '이미지를 읽지 못했어요' })
    }
  }

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = [...e.clipboardData.files]
    if (!files.some((f) => f.type.startsWith('image/'))) return
    e.preventDefault()
    void readImages(files)
  }

  const onDrop = (e: DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    void readImages([...e.dataTransfer.files])
  }

  const existing = useMemo(() => new Set(benefits.map(signature)), [benefits])

  const parsed = useMemo(() => {
    const { rows, skipped, approvalDate } = parseBenefits(text, settings.year)
    const mergedAll = mergeSameName(rows, approvalDate)
    let items: (ParsedBenefit & { parts?: BenefitPart[] })[] = merge ? mergedAll : rows
    // 지출결의서는 결재일에 지급되므로 그 날짜로 등록하고, 실제 지출일은 메모에 남긴다
    if (approvalDate && useApproval) {
      items = items.map((r) =>
        r.parts || r.date === approvalDate
          ? r
          : { ...r, date: approvalDate, memo: [`지출일 ${fmtShort(r.date)}`, r.memo].filter(Boolean).join(' · ') },
      )
    }
    return {
      items: items.map((r) => ({ ...r, duplicate: existing.has(signature(r)) })),
      skipped,
      approvalDate,
      mergeable: rows.length - mergedAll.length,
    }
  }, [text, settings.year, existing, merge, useApproval])

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
      parts: r.parts,
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
            onPaste={onPaste}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            placeholder={PLACEHOLDER}
            rows={6}
            className="w-full resize-y rounded-[12px] border border-hairline bg-paper px-4 py-3 text-caption leading-relaxed text-ink outline-none placeholder:text-mid focus:border-ink focus:ring-2 focus:ring-ink/10"
          />
          <div className="mt-1.5 flex items-start justify-between gap-3">
            <p className="text-micro text-mid">
              {ocr.busy
                ? '이미지에서 글자를 읽는 중… 처음에는 한국어 데이터를 받느라 조금 걸려요.'
                : ocr.error
                  ? `이미지를 읽지 못했어요 — ${ocr.error}`
                  : '날짜와 금액이 있는 줄만 가져옵니다. 카테고리는 항목명에서 자동으로 추정하고, 가져온 뒤 수정할 수 있어요.'}
            </p>
            <Button variant="ghost" size="sm" className="shrink-0 px-0" disabled={ocr.busy} onClick={() => fileRef.current?.click()}>
              이미지 선택
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                void readImages([...(e.target.files ?? [])])
                e.target.value = ''
              }}
            />
          </div>
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
                      <Badge className={catStyle(r.category)}>{r.category}</Badge>
                      <span className="min-w-0 flex-1 truncate text-micro text-ink">
                        {r.duplicate ? <span className="text-mid">이미 등록됨</span> : r.name}
                      </span>
                      <span className="shrink-0 text-caption tabular-nums">{fmtWon(r.amount)}</span>
                    </li>
                  )
                })}
              </ul>
            )}

            {parsed.approvalDate && (
              <label className="mt-3 flex items-start gap-2 rounded-[16px] bg-canvas px-4 py-3">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 accent-blue"
                  checked={useApproval}
                  onChange={(e) => setUseApproval(e.target.checked)}
                />
                <span className="text-micro leading-relaxed text-deep">
                  결재일 {fmtShort(parsed.approvalDate)} 로 등록하기
                  <span className="mt-0.5 block text-mid">지출결의서는 결재일에 지급되므로 그 날짜로 잡고, 실제 지출일은 메모에 남깁니다.</span>
                </span>
              </label>
            )}

            {(parsed.mergeable > 0 || merge) && (
              <label className="mt-3 flex items-start gap-2 rounded-[16px] bg-canvas px-4 py-3">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 accent-blue"
                  checked={merge}
                  onChange={(e) => setMerge(e.target.checked)}
                />
                <span className="text-micro leading-relaxed text-deep">
                  항목명이 같은 건을 하나로 합치기
                  <span className="mt-0.5 block text-mid">
                    금액을 더하고, 이름에 '개월' 이 있으면 개월 수도 더합니다. (1개월 구독 3건 → 3개월 구독)
                  </span>
                  <span className="mt-0.5 block text-mid">
                    날짜는{' '}
                    {parsed.approvalDate ? `결재일 ${fmtShort(parsed.approvalDate)}` : '마지막 지출일'} 기준
                  </span>
                </span>
              </label>
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

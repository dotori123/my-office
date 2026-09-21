import { useEffect, useMemo, useState } from 'react'
import { LEAVE_TYPES, LEAVE_UNIT, type Leave, type LeaveType } from '@/types'
import { useApp } from '@/store/AppContext'
import { Button, Field, Input, Modal } from '@/components/ui'
import { buildDayOffContext, countWorkingDays, today } from '@/utils/date'

interface Props {
  open: boolean
  onClose: () => void
  /** 수정 모드일 때 기존 데이터 */
  initial?: Leave | null
  /** 추천 기능에서 넘어올 때 미리 채울 날짜 */
  presetDates?: { start: string; end: string }
}

export default function LeaveForm({ open, onClose, initial, presetDates }: Props) {
  const { state, dispatch } = useApp()
  const [type, setType] = useState<LeaveType>('연차')
  const [startDate, setStartDate] = useState(today())
  const [endDate, setEndDate] = useState(today())
  const [amount, setAmount] = useState('1')
  const [memo, setMemo] = useState('')
  const [touchedAmount, setTouchedAmount] = useState(false)
  /** 종료일을 직접 건드렸는지 — 그전까지는 시작일을 그대로 따라간다 */
  const [touchedEnd, setTouchedEnd] = useState(false)

  const ctx = useMemo(() => buildDayOffContext(state.leaves.filter((l) => l.id !== initial?.id), state.events), [state, initial])

  useEffect(() => {
    if (!open) return
    if (initial) {
      setType(initial.type)
      setStartDate(initial.startDate)
      setEndDate(initial.endDate)
      setAmount(String(initial.amount))
      setMemo(initial.memo ?? '')
      setTouchedAmount(true)
      setTouchedEnd(initial.endDate !== initial.startDate)
    } else {
      const s = presetDates?.start ?? today()
      setType('연차')
      setStartDate(s)
      setEndDate(presetDates?.end ?? s)
      setAmount('1')
      setMemo('')
      setTouchedAmount(false)
      setTouchedEnd(Boolean(presetDates && presetDates.end !== presetDates.start))
    }
  }, [open, initial, presetDates])

  // 유형/기간 변경 시 차감 일수 자동 계산 (사용자가 직접 수정 전까지)
  useEffect(() => {
    if (touchedAmount) return
    const days = type === '연차' || type === '기타' ? Math.max(1, countWorkingDays(startDate, endDate, ctx)) : 1
    setAmount(String(days * LEAVE_UNIT[type]))
  }, [type, startDate, endDate, touchedAmount, ctx])

  const submit = () => {
    const payload = {
      type,
      startDate,
      endDate: endDate < startDate ? startDate : endDate,
      amount: Number(amount) || 0,
      memo: memo.trim() || undefined,
    }
    if (initial) dispatch({ type: 'leave/update', payload: { ...initial, ...payload } })
    else dispatch({ type: 'leave/add', payload })
    onClose()
  }

  const isRange = type === '연차' || type === '기타'

  return (
    <Modal open={open} onClose={onClose} title={initial ? '연차 수정' : '연차 등록'}>
      <div className="space-y-5">
        <Field label="유형">
          <div className="grid grid-cols-4 gap-2">
            {LEAVE_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t)
                  setTouchedAmount(false)
                  if (t !== '연차' && t !== '기타') {
                    setEndDate(startDate)
                    setTouchedEnd(false)
                  }
                }}
                className={`rounded-pill px-2 py-2 text-caption transition-colors ${
                  type === t ? 'bg-ink text-paper' : 'bg-wash text-deep hover:bg-hairline'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        <div className={isRange ? 'grid grid-cols-2 gap-3' : ''}>
          <Field label={isRange ? '시작일' : '날짜'}>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                const v = e.target.value
                setStartDate(v)
                // 종료일을 직접 고르기 전까지는 시작일을 그대로 따라간다
                if (!isRange || !touchedEnd || endDate < v) setEndDate(v)
                setTouchedAmount(false)
              }}
            />
          </Field>
          {isRange && (
            <Field label="종료일">
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setTouchedEnd(true)
                  setTouchedAmount(false)
                }}
              />
            </Field>
          )}
        </div>

        <Field label="차감 일수" hint="주말·공휴일은 자동 제외됩니다. 필요하면 직접 수정하세요.">
          <Input
            type="number"
            step="0.25"
            min="0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setTouchedAmount(true)
            }}
          />
        </Field>

        <Field label="메모">
          <Input placeholder="선택" value={memo} onChange={(e) => setMemo(e.target.value)} />
        </Field>

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button className="flex-1" onClick={submit} disabled={!startDate || Number(amount) <= 0}>
            {initial ? '저장' : '등록'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

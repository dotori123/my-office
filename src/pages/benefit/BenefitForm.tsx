import { useEffect, useState } from 'react'
import { BENEFIT_CATEGORIES, type Benefit, type BenefitCategory } from '@/types'
import { useApp } from '@/store/AppContext'
import { Button, Field, Input, Modal, MoneyInput, Select } from '@/components/ui'
import { today } from '@/utils/date'

interface Props {
  open: boolean
  onClose: () => void
  initial?: Benefit | null
}

export default function BenefitForm({ open, onClose, initial }: Props) {
  const { dispatch } = useApp()
  const [date, setDate] = useState(today())
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<BenefitCategory>('도서')
  const [memo, setMemo] = useState('')
  const [receipt, setReceipt] = useState('')

  useEffect(() => {
    if (!open) return
    setDate(initial?.date ?? today())
    setName(initial?.name ?? '')
    setAmount(initial ? String(initial.amount) : '')
    setCategory(initial?.category ?? '도서')
    setMemo(initial?.memo ?? '')
    setReceipt(initial?.receipt ?? '')
  }, [open, initial])

  const submit = () => {
    const payload = {
      date,
      name: name.trim(),
      amount: Number(amount) || 0,
      category,
      memo: memo.trim() || undefined,
      receipt: receipt || undefined,
    }
    if (initial) dispatch({ type: 'benefit/update', payload: { ...initial, ...payload } })
    else dispatch({ type: 'benefit/add', payload })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? '사용 내역 수정' : '사용 내역 등록'}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="사용일">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="카테고리">
            <Select value={category} onChange={(e) => setCategory(e.target.value as BenefitCategory)}>
              {BENEFIT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="사용처 / 항목">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="금액">
          <div className="relative">
            <MoneyInput placeholder="0" value={amount} onValueChange={setAmount} className="pr-8" />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-caption text-mid">원</span>
          </div>
        </Field>
        <Field label="메모">
          <Input placeholder="선택" value={memo} onChange={(e) => setMemo(e.target.value)} />
        </Field>
        <Field label="증빙자료" hint="프론트 단계에서는 파일명만 저장됩니다.">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setReceipt(e.target.files?.[0]?.name ?? '')}
            className="block w-full text-caption text-mid file:mr-3 file:rounded-pill file:border-0 file:bg-wash file:px-4 file:py-1.5 file:text-caption file:text-ink hover:file:bg-hairline"
          />
          {receipt && <span className="mt-1.5 block text-micro text-mid">첨부: {receipt}</span>}
        </Field>
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button className="flex-1" onClick={submit} disabled={!name.trim() || Number(amount) <= 0}>
            {initial ? '저장' : '등록'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

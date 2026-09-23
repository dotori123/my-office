import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useApp } from '@/store/AppContext'
import { Button, Field, Input, Modal, MoneyInput } from '@/components/ui'
import { fmtFull, fmtShort, tenureText } from '@/utils/date'
import { accrualFor } from '@/utils/accrual'

/**
 * 내 정보 — 상단 내비의 이름을 눌러 연다.
 * 어느 페이지에서든 열 수 있도록 여는 함수를 context 로 내려준다.
 * 추후 U+웍스 연동 시 이 값들은 자동으로 채워질 예정.
 */
const OpenProfileContext = createContext<() => void>(() => {})

export const useOpenProfile = () => useContext(OpenProfileContext)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <OpenProfileContext.Provider value={() => setOpen(true)}>
      {children}
      <ProfileModal open={open} onClose={() => setOpen(false)} />
    </OpenProfileContext.Provider>
  )
}

function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useApp()
  const { user, settings } = state

  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [department, setDepartment] = useState('')
  const [position, setPosition] = useState('')
  const [joinDate, setJoinDate] = useState('')
  const [totalLeave, setTotalLeave] = useState('')
  const [totalBenefit, setTotalBenefit] = useState('')

  useEffect(() => {
    if (!open) return
    setName(user.name)
    setCompany(user.company)
    setDepartment(user.department)
    setPosition(user.position)
    setJoinDate(user.joinDate)
    setTotalLeave(String(settings.totalLeave))
    setTotalBenefit(String(settings.totalBenefit))
  }, [open, user, settings])

  const submit = () => {
    dispatch({
      type: 'user/update',
      payload: {
        name: name.trim(),
        company: company.trim(),
        department: department.trim(),
        position: position.trim(),
        joinDate,
      },
    })
    dispatch({
      type: 'settings/update',
      payload: { totalLeave: Number(totalLeave) || 0, totalBenefit: Number(totalBenefit) || 0 },
    })
    onClose()
  }

  const tenure = tenureText(joinDate)
  // 입사일로 회계연도 기준 연차를 계산해 참고값으로 보여준다
  const accrual = accrualFor(joinDate, settings.year)
  const applied = accrual !== null && Number(totalLeave) === accrual.total

  return (
    <Modal open={open} onClose={onClose} title="내 정보">
      <div className="space-y-5">
        <Field label="이름">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="회사">
          <Input value={company} onChange={(e) => setCompany(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="소속 부서">
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
          </Field>
          <Field label="직무">
            <Input value={position} onChange={(e) => setPosition(e.target.value)} />
          </Field>
        </div>
        <Field label="입사일" hint={tenure ? `근속 ${tenure}` : undefined}>
          <Input type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} />
        </Field>

        <div className="border-t border-hairline pt-5">
          <p className="mb-3 text-caption text-mid">{settings.year}년 지급 기준</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="총 연차">
              <div className="relative">
                <Input type="number" step="0.5" min="0" value={totalLeave} onChange={(e) => setTotalLeave(e.target.value)} className="pr-8" />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-caption text-mid">일</span>
              </div>
            </Field>
            <Field label="총 지원금">
              <div className="relative">
                <MoneyInput value={totalBenefit} onValueChange={setTotalBenefit} className="pr-8" />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-caption text-mid">원</span>
              </div>
            </Field>
          </div>

          {accrual && (
            <div className="mt-3 rounded-[16px] bg-canvas px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-caption text-deep">
                  입사일 기준 <span className="font-medium text-ink">{accrual.total}일</span>
                  <span className="text-mid"> · {accrual.note}</span>
                </p>
                {!applied && (
                  <button type="button" onClick={() => setTotalLeave(String(accrual.total))} className="shrink-0 text-caption text-link hover:underline">
                    적용
                  </button>
                )}
              </div>
              {accrual.nextMonthlyDate && (
                <p className="mt-1 text-micro text-mid">
                  다음 월차 {fmtShort(accrual.nextMonthlyDate)}에 +1일
                  {accrual.monthlyExpiresAt && ` · 월차는 입사 1주년 ${fmtFull(accrual.monthlyExpiresAt)}까지 써야 해요`}
                </p>
              )}
              <p className="mt-1 text-micro text-mid">회계연도(1/1) 기준으로 계산한 참고값이에요. 회사 계산과 다르면 직접 고치세요.</p>
            </div>
          )}
        </div>

        <p className="text-micro text-mid">급여·평가 등 민감정보는 입력하지 않습니다. 입력한 값은 이 브라우저에만 저장돼요.</p>

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button className="flex-1" onClick={submit}>
            저장
          </Button>
        </div>
      </div>
    </Modal>
  )
}

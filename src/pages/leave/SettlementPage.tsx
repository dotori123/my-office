import { useMemo, useState } from 'react'
import { useApp } from '@/store/AppContext'
import { useSeo } from '@/hooks/useSeo'
import { Band, Card, Field, Input, PageHero, Stat, cx } from '@/components/ui'
import { fmtFull, today } from '@/utils/date'
import { fmtDays } from '@/utils/format'
import { settlementFor, firstAnniversary } from '@/utils/accrual'

/**
 * 퇴사 연차 정산 — 내비에 없고 /leave/settlement 주소로만 들어간다.
 *
 * 회계연도 기준으로 받아 온 연차와 입사일 기준으로 다시 계산한 연차를 견줘 차이를 보여준다.
 * 수당 금액은 급여 정보가 필요해 다루지 않는다.
 */
export default function SettlementPage() {
  useSeo({ title: '연차 정산 — MY OFFICE', description: '퇴사일 기준으로 연차를 다시 계산해 봅니다.', path: '/leave/settlement' })

  const { state } = useApp()
  const { user, leaves } = state
  const [joinDate, setJoinDate] = useState(user.joinDate)
  const [leaveDate, setLeaveDate] = useState(today())

  const result = useMemo(() => settlementFor(joinDate, leaveDate), [joinDate, leaveDate])

  // 재직 기간에 쓴 연차 (경조휴가는 차감되지 않으므로 빠진다)
  const used = useMemo(
    () => leaves.filter((l) => l.startDate >= joinDate && l.startDate <= leaveDate).reduce((s, l) => s + l.amount, 0),
    [leaves, joinDate, leaveDate],
  )

  const remaining = result ? Math.round((result.legal.total - used) * 100) / 100 : 0

  return (
    <>
      <Band inner="pb-8 pt-14 md:pb-10 md:pt-20">
        <PageHero
          eyebrow="참고용 계산"
          title="연차 정산"
          sub="퇴사할 때는 입사일부터 퇴사일까지로 연차를 다시 계산합니다. 회계연도 기준으로 받아 온 연차와 얼마나 차이 나는지 봅니다."
        />
      </Band>

      <Band tone="gray">
        <div className="grid gap-5 md:grid-cols-5">
          <Card className="md:col-span-2" title="기간">
            <div className="space-y-4">
              <Field label="입사일">
                <Input type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} />
              </Field>
              <Field
                label="퇴사(예정)일"
                // 1년 미만일 때만 안내 — 월차가 소멸하는 날이라 의미가 있다
                hint={joinDate && leaveDate < firstAnniversary(joinDate) ? `입사 1주년 ${fmtFull(firstAnniversary(joinDate))}` : undefined}
              >
                <Input type="date" value={leaveDate} min={joinDate} onChange={(e) => setLeaveDate(e.target.value)} />
              </Field>
              <p className="rounded-[16px] bg-canvas px-4 py-3 text-caption text-mid">
                내 정보의 입사일을 가져왔어요. 여기서 바꿔도 저장되지 않으니 이것저것 넣어 봐도 괜찮아요.
              </p>
            </div>
          </Card>

          <div className="space-y-5 md:col-span-3">
            {!result ? (
              <Card>
                <p className="py-6 text-center text-caption text-mid">입사일과 퇴사일을 확인해 주세요.</p>
              </Card>
            ) : (
              <>
                <Card eyebrow="입사일 기준으로 다시 계산하면">
                  <div className="flex items-end justify-between">
                    <p className="text-heading-sm font-bold tabular-nums md:text-heading">{fmtDays(result.legal.total)}</p>
                    <p className="text-body-sm text-mid">회계연도 기준 {fmtDays(result.fiscal.total)}</p>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <Stat label="월차" value={fmtDays(result.legal.monthly)} />
                    <Stat label="연차" value={fmtDays(result.legal.annual)} />
                    <Stat label="사용" value={fmtDays(used)} />
                  </div>

                  <div className={cx('mt-5 rounded-[16px] px-4 py-3', result.diff === 0 ? 'bg-canvas' : 'bg-starlight')}>
                    {result.diff === 0 ? (
                      <p className="text-caption text-deep">두 기준의 연차 일수가 같아요.</p>
                    ) : result.diff > 0 ? (
                      <p className="text-caption text-deep">
                        입사일 기준이 <span className="font-medium text-ink">{fmtDays(result.diff)} 많아요.</span> 정산 때 그만큼 더 받을 수 있어요.
                      </p>
                    ) : (
                      <p className="text-caption text-deep">
                        회계연도 기준으로 <span className="font-medium text-ink">{fmtDays(-result.diff)} 더 받아</span> 두었어요. 이미 썼다면 정산에서 빠질 수 있어요.
                      </p>
                    )}
                    <p className="mt-1 text-micro text-mid">
                      남은 연차 {fmtDays(remaining)} (발생 {fmtDays(result.legal.total)} − 사용 {fmtDays(used)}) · 사용 일수는 이 앱에 등록한 것만 세므로 실제와 다를 수 있어요
                    </p>
                  </div>
                </Card>

                <Card title="부여 내역">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-caption text-mid">입사일 기준</p>
                      <ul className="space-y-1.5">
                        {result.legal.monthly > 0 && (
                          <li className="flex justify-between text-caption">
                            <span className="text-deep">1년 미만 월차</span>
                            <span className="tabular-nums">{fmtDays(result.legal.monthly)}</span>
                          </li>
                        )}
                        {result.legal.grants.map((g, i) => (
                          <li key={g.date} className="flex justify-between text-caption">
                            <span className="text-deep">
                              {fmtFull(g.date)} <span className="text-mid">({i + 1}주년)</span>
                            </span>
                            <span className="tabular-nums">{fmtDays(g.days)}</span>
                          </li>
                        ))}
                        {result.legal.total === 0 && <li className="text-caption text-mid">아직 발생한 연차가 없어요.</li>}
                      </ul>
                    </div>

                    <div>
                      <p className="mb-2 text-caption text-mid">회계연도 기준</p>
                      <ul className="space-y-1.5">
                        {result.fiscal.monthly > 0 && (
                          <li className="flex justify-between text-caption">
                            <span className="text-deep">1년 미만 월차</span>
                            <span className="tabular-nums">{fmtDays(result.fiscal.monthly)}</span>
                          </li>
                        )}
                        {result.fiscal.grants.map((g) => (
                          <li key={g.year} className="flex justify-between text-caption">
                            <span className="text-deep">{g.year}.01.01</span>
                            <span className="tabular-nums">{fmtDays(g.days)}</span>
                          </li>
                        ))}
                        {result.fiscal.total === 0 && <li className="text-caption text-mid">아직 부여된 연차가 없어요.</li>}
                      </ul>
                    </div>
                  </div>
                </Card>
              </>
            )}

            <p className="text-micro leading-relaxed text-mid">
              법정 기준(1년 미만 매월 1일·최대 11일, 1년마다 15일, 3년 이상 2년마다 1일 가산)으로 계산한 참고값이에요. 회사 규정이나 실제 정산과 다를 수 있고, 미사용 연차 수당 금액은 급여 정보가 필요해 다루지 않습니다.
            </p>
          </div>
        </div>
      </Band>
    </>
  )
}

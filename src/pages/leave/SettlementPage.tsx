import { useMemo, useState } from 'react'
import { useApp } from '@/store/AppContext'
import { useSeo } from '@/hooks/useSeo'
import { Band, Card, Field, Input, PageHero, Stat, cx } from '@/components/ui'
import { fmtFull, today } from '@/utils/date'
import { fmtDays } from '@/utils/format'
import { yearEndOutcome } from '@/utils/leave'
import { accrualFor, settlementFor, firstAnniversary } from '@/utils/accrual'

/**
 * 퇴사 연차 정산 — 내비에 없고 /leave/settlement 주소로만 들어간다.
 *
 * 두 가지를 따로 본다.
 *  1. 수당 대상: 퇴사하는 해에 받은 연차 중 아직 안 쓴 일수 (연차수당은 그 해 기준이다)
 *  2. 법정 미달 확인: 입사일 기준으로 다시 계산한 '누적' 발생량과 회계연도 기준 '누적' 부여량의 차이.
 *     회계연도 기준으로 운영하더라도 입사일 기준보다 적게 주면 안 되므로, 모자라면 그만큼 더 받는다.
 *
 * 수당 금액은 급여 정보가 필요해 다루지 않는다.
 */
export default function SettlementPage() {
  useSeo({ title: '연차 정산 — MY OFFICE', description: '퇴사일 기준으로 연차를 다시 계산해 봅니다.', path: '/leave/settlement' })

  const { state } = useApp()
  const { user, leaves } = state
  const [joinDate, setJoinDate] = useState(user.joinDate)
  const [leaveDate, setLeaveDate] = useState(today())
  /** 연도별 부여 내역은 평소엔 접어 둔다 — 위의 '남은 연차'와 헷갈리기 쉬워서 */
  const [showGrants, setShowGrants] = useState(false)

  const leaveYear = Number(leaveDate.slice(0, 4))

  /** 퇴사하는 해에 받은 연차 — 수당 대상을 따질 기준 */
  const thisYear = useMemo(() => accrualFor(joinDate, leaveYear, leaveDate), [joinDate, leaveYear, leaveDate])

  /** 입사일 기준 누적 vs 회계연도 기준 누적 */
  const cumulative = useMemo(() => settlementFor(joinDate, leaveDate), [joinDate, leaveDate])

  /** 퇴사하는 해에 쓴 연차 (경조휴가는 차감이 없어 저절로 빠진다) */
  const usedThisYear = useMemo(
    () => leaves.filter((l) => l.startDate >= `${leaveYear}-01-01` && l.startDate <= leaveDate).reduce((s, l) => s + l.amount, 0),
    [leaves, leaveYear, leaveDate],
  )

  const granted = thisYear?.total ?? 0
  const unused = Math.round((granted - usedThisYear) * 100) / 100

  return (
    <>
      <Band inner="pb-8 pt-14 md:pb-10 md:pt-20">
        <PageHero
          eyebrow="참고용 계산"
          title="연차 정산"
          sub="퇴사하는 해에 남은 연차가 얼마인지 보고, 입사일 기준으로 다시 계산했을 때 모자라지 않는지 확인합니다."
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
            {!cumulative || !thisYear ? (
              <Card>
                <p className="py-6 text-center text-caption text-mid">입사일과 퇴사일을 확인해 주세요.</p>
              </Card>
            ) : (
              <>
                {/* 1. 수당 대상 — 그 해 연차 기준 */}
                <Card eyebrow={`${leaveYear}년 남은 연차`}>
                  <div className="flex items-end justify-between">
                    <p className={cx('text-heading-sm font-bold tabular-nums md:text-heading', unused < 0 && 'text-ember')}>{fmtDays(unused)}</p>
                    <p className="text-body-sm text-mid">미사용 연차 수당 대상</p>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <Stat label={`${leaveYear}년 부여`} value={fmtDays(granted)} />
                    <Stat label="사용" value={fmtDays(usedThisYear)} />
                    <Stat label="미사용" value={fmtDays(unused)} />
                  </div>

                  <p className="mt-4 text-caption text-mid">
                    {thisYear.note}
                    {unused < 0 && ' · 받은 것보다 더 썼어요. 정산에서 빠질 수 있어요.'}
                  </p>
                  {unused > 0 && (
                    <p className="mt-1 text-micro text-mid">
                      연말까지 다니면 {fmtDays(yearEndOutcome(unused).payout)}만 수당이고 나머지는 소멸하지만, 퇴사 정산은 보통 남은 연차를 모두 수당으로 줍니다.
                    </p>
                  )}
                  <p className="mt-1 text-micro text-mid">
                    사용 일수는 이 앱에 등록한 {leaveYear}년 연차만 셉니다. 실제 기록과 다르면 숫자도 달라져요.
                  </p>
                </Card>

                {/* 2. 법정 미달 확인 — 누적 비교. 결론만 보이고 내역은 접어 둔다 */}
                <Card eyebrow="퇴사할 때 다시 계산하면" title={`입사일 기준 누적 ${fmtDays(cumulative.legal.total)} / 회계연도 기준 ${fmtDays(cumulative.fiscal.total)}`}>
                  <div className={cx('rounded-[16px] px-4 py-3', cumulative.diff > 0 ? 'bg-starlight' : 'bg-canvas')}>
                    {cumulative.diff > 0 ? (
                      <p className="text-caption text-deep">
                        입사일 기준이 <span className="font-medium text-ink">{fmtDays(cumulative.diff)} 많아요.</span> 회계연도 기준으로 운영해도 입사일 기준보다 적게 줄 수는 없어서, 그만큼 더 받을 수 있어요.
                      </p>
                    ) : cumulative.diff < 0 ? (
                      <p className="text-caption text-deep">
                        회계연도 기준으로 <span className="font-medium text-ink">{fmtDays(-cumulative.diff)} 더</span> 받아 두었어요. 법정 미달은 아니에요.
                      </p>
                    ) : (
                      <p className="text-caption text-deep">두 기준의 누적 일수가 같아요.</p>
                    )}
                    <p className="mt-1 text-micro text-mid">
                      입사한 날부터 퇴사일까지 발생한 일수를 모두 더해 견준 값이에요. 위의 남은 연차와는 다른 이야기예요.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowGrants((v) => !v)}
                    aria-expanded={showGrants}
                    className="mt-4 flex items-center gap-1 text-caption text-mid transition-colors hover:text-ink"
                  >
                    연도별 내역 {showGrants ? '접기' : '보기'}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={cx('shrink-0 transition-transform', showGrants && 'rotate-180')}
                    >
                      <path d="M3 4.5l3 3 3-3" />
                    </svg>
                  </button>

                  <div className={cx('mt-4 grid gap-6 sm:grid-cols-2', !showGrants && 'hidden')}>
                    <div>
                      <p className="mb-2 text-caption text-mid">입사일 기준 (1주년마다)</p>
                      <ul className="space-y-1.5">
                        {cumulative.legal.monthly > 0 && (
                          <li className="flex justify-between text-caption">
                            <span className="text-deep">1년 미만 월차</span>
                            <span className="tabular-nums">{fmtDays(cumulative.legal.monthly)}</span>
                          </li>
                        )}
                        {cumulative.legal.grants.map((g, i) => (
                          <li key={g.date} className="flex justify-between text-caption">
                            <span className="text-deep">
                              {fmtFull(g.date)} <span className="text-mid">({i + 1}주년)</span>
                            </span>
                            <span className="tabular-nums">{fmtDays(g.days)}</span>
                          </li>
                        ))}
                        {cumulative.legal.total === 0 && <li className="text-caption text-mid">아직 발생한 연차가 없어요.</li>}
                      </ul>
                    </div>

                    <div>
                      <p className="mb-2 text-caption text-mid">회계연도 기준 (매년 1/1)</p>
                      <ul className="space-y-1.5">
                        {cumulative.fiscal.monthly > 0 && (
                          <li className="flex justify-between text-caption">
                            <span className="text-deep">1년 미만 월차</span>
                            <span className="tabular-nums">{fmtDays(cumulative.fiscal.monthly)}</span>
                          </li>
                        )}
                        {cumulative.fiscal.grants.map((g) => (
                          <li key={g.year} className="flex justify-between text-caption">
                            <span className="text-deep">{g.year}.01.01</span>
                            <span className="tabular-nums">{fmtDays(g.days)}</span>
                          </li>
                        ))}
                        {cumulative.fiscal.total === 0 && <li className="text-caption text-mid">아직 부여된 연차가 없어요.</li>}
                      </ul>
                    </div>
                  </div>
                </Card>
              </>
            )}

            <p className="text-micro leading-relaxed text-mid">
              법정 기준(1년 미만 매월 1일·최대 11일, 1년마다 15일, 3년 이상 2년마다 1일 가산)으로 계산한 참고값이에요. 전년도 미사용분 이월은 회사마다 달라 계산에 넣지 않았고, 수당 금액은 급여 정보가 필요해 다루지 않습니다.
            </p>
          </div>
        </div>
      </Band>
    </>
  )
}

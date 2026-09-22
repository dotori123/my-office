import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Band, Card } from '@/components/ui'
import CalendarGrid from './CalendarGrid'
import CountUp from './CountUp'
import Reveal from './Reveal'
import { BenefitMock, CalendarMock, DashboardMock, LeaveMock, ProjectMock } from './Mocks'
import { ramp, useStageProgress } from './useStageProgress'

/**
 * 소개 페이지. 내비에는 넣지 않고 공유용 링크(/intro)로만 쓴다.
 * three 를 쓰는 히어로가 있어 App 에서 lazy 로 불러온다.
 *
 * 첫 화면은 스크롤 스테이지다 — 캔버스를 sticky 로 붙여두고
 * 스크롤 진행도에 따라 3D 격자와 문구가 차례로 바뀐다.
 */

const FEATURES = [
  {
    label: 'Leave',
    title: '연차',
    body: '총 연차·사용·예정·잔여를 한 화면에서. 반차·반반차까지 0.25일 단위로 계산하고, 기간 연차는 주말과 공휴일을 빼고 차감합니다.',
    mock: <LeaveMock />,
  },
  {
    label: 'Benefit',
    title: '지원비',
    body: '도서·교육·소프트웨어를 통합 지원비로 관리해요. 월별 사용액과 카테고리별 비중을 보여주고, 잔액을 자동으로 계산합니다.',
    mock: <BenefitMock />,
  },
  {
    label: 'Calendar',
    title: '캘린더',
    body: '공휴일·연차·회사 일정·개인 일정을 한 달력에. 회사 휴무일을 등록하면 연차 계산과 추천에 함께 반영됩니다.',
    mock: <CalendarMock />,
  },
  {
    label: 'Projects',
    title: '프로젝트 바로가기',
    body: '테스트·운영 서버, WBS, 저장소, 디자인 링크를 프로젝트별로 모아둡니다. 자주 쓰는 프로젝트는 대시보드에 고정할 수 있어요.',
    mock: <ProjectMock />,
  },
]

const ctaClass = 'rounded-pill bg-blue px-6 py-[13px] text-body-sm text-paper transition-colors hover:bg-blue-hover'

export default function IntroPage() {
  const stageRef = useRef<HTMLElement>(null)
  const progress = useStageProgress(stageRef)

  // 스테이지 안의 문구 두 개를 스크롤에 맞춰 교차시킨다 (리렌더 없이 스타일만)
  const introCopyRef = useRef<HTMLDivElement>(null)
  const recommendCopyRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const p = progress.current
      const out = ramp(p, 0.06, 0.3)
      const inn = ramp(p, 0.42, 0.66)

      if (introCopyRef.current) {
        introCopyRef.current.style.opacity = String(1 - out)
        introCopyRef.current.style.transform = `translateY(${-out * 40}px)`
      }
      if (recommendCopyRef.current) {
        recommendCopyRef.current.style.opacity = String(inn)
        recommendCopyRef.current.style.transform = `translateY(${(1 - inn) * 40}px)`
      }
      if (hintRef.current) hintRef.current.style.opacity = String(1 - ramp(p, 0, 0.08))
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [progress])

  return (
    <div className="min-h-dvh bg-paper text-ink">
      {/* 스크롤 스테이지 — 3D 격자가 붙어 있는 동안 문구가 바뀐다 */}
      <section ref={stageRef} className="relative h-[250vh]">
        <div className="sticky top-0 h-dvh overflow-hidden">
          <CalendarGrid className="absolute inset-0 h-full w-full" progressRef={progress} />
          {/* 문구가 올라앉을 자리 — 격자가 흰 배경으로 스며들게 한다 */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%]"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.94) 38%, #ffffff 58%)',
            }}
          />

          {/* 1장 — 첫인사 */}
          <div
            ref={introCopyRef}
            className="absolute inset-x-0 bottom-[9vh] flex flex-col items-center px-5 text-center md:bottom-[11vh]"
          >
            <p className="text-body-sm text-mid">MY OFFICE</p>
            <h1 className="mt-3 text-[40px] font-bold leading-[1.05] tracking-[-1.2px] md:text-heading-lg">
              회사생활, 이것저것
              <br />
              찾지 말고 한눈에.
            </h1>
            <p className="mt-5 max-w-[520px] text-body-sm text-mid md:text-body">
              남은 연차가 며칠인지, 지원비를 얼마나 썼는지, 다음 휴일이 언제인지.
            </p>
          </div>

          {/* 2장 — 연차 추천 */}
          <div
            ref={recommendCopyRef}
            className="absolute inset-x-0 bottom-[9vh] flex flex-col items-center px-5 text-center opacity-0 md:bottom-[11vh]"
          >
            <p className="text-caption text-mid">연차 추천</p>
            <h2 className="mt-3 text-[34px] font-bold leading-[1.1] tracking-[-1px] md:text-heading">
              하루를 써서
              <br />
              가장 길게 쉬는 법.
            </h2>
            <p className="mt-5 max-w-[520px] text-body-sm text-mid md:text-body">
              공휴일·주말·회사 휴무일과 이미 쓴 연차까지 계산해서, 가장 효율이 좋은 날짜를 순서대로 찾아줍니다.
            </p>
          </div>

          {/* 스크롤 안내 */}
          <div ref={hintRef} className="absolute inset-x-0 bottom-6 flex justify-center">
            <span className="text-micro text-mid">스크롤</span>
          </div>
        </div>
      </section>

      {/* 추천 결과 예시 */}
      <Band tone="gray">
        <Reveal>
          <div className="mx-auto max-w-[720px]">
            <Card>
              <p className="text-micro font-medium text-ember">추천</p>
              <p className="mt-2 text-subheading font-semibold md:text-heading-sm">9월 23일 (수)에 연차를 사용하면</p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  ['휴식 기간', '09.22 – 09.28'],
                  ['연속 휴식', '7일'],
                  ['사용 연차', '1일'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[16px] bg-canvas p-4">
                    <p className="text-caption text-mid">{label}</p>
                    <p className="mt-1 text-body-sm font-medium">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-body-sm text-mid">추석 연휴와 연결</p>
            </Card>
          </div>
        </Reveal>

        {/* 숫자 */}
        <div className="mx-auto mt-10 grid max-w-[720px] grid-cols-3 gap-5 text-center">
          {[
            { to: 1, suffix: '일', label: '사용한 연차' },
            { to: 7, suffix: '일', label: '연속 휴식' },
            { to: 0.25, suffix: '일', label: '계산 단위', decimals: 2 },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1}>
              <p className="text-heading-sm font-bold tabular-nums md:text-heading">
                <CountUp to={s.to} suffix={s.suffix} decimals={s.decimals ?? 0} />
              </p>
              <p className="mt-1 text-caption text-mid">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </Band>

      {/* 기능 */}
      <Band>
        <Reveal>
          <h2 className="text-body-lg font-semibold tracking-[0.007em]">한 곳에 모아서.</h2>
        </Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 2) * 0.1}>
              <Card tone="gray" eyebrow={f.label} title={f.title} className="h-full">
                <p className="text-body-sm text-mid">{f.body}</p>
                <div className="mt-5">{f.mock}</div>
              </Card>
            </Reveal>
          ))}
        </div>
      </Band>

      {/* 대시보드 미리보기 */}
      <Band tone="gray">
        <Reveal>
          <div className="mx-auto max-w-[560px] text-center">
            <h2 className="text-subheading font-semibold tracking-[0.007em] md:text-heading-sm">
              열자마자 보이는 화면.
            </h2>
            <p className="mt-4 text-body-sm text-mid">
              다음 휴가까지 며칠 남았는지가 가장 먼저 보이고, 그 아래에 연차와 지원비 잔액이 이어집니다.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mx-auto mt-10 max-w-[720px]">
            <DashboardMock />
          </div>
        </Reveal>
      </Band>

      {/* 가져오기 */}
      <Band>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <Reveal>
            <p className="text-caption text-mid">붙여넣기로 가져오기</p>
            <h2 className="mt-2 text-subheading font-semibold tracking-[0.007em] md:text-heading-sm">
              근태 시스템의 표를
              <br />
              그대로 붙여넣으세요.
            </h2>
            <p className="mt-4 max-w-[460px] text-body-sm text-mid">
              휴가 사용내역을 복사해 붙여넣으면 날짜·유형·일수를 알아서 읽습니다. 이미 등록된 건은 자동으로 걸러내고, 가져오기 전에 미리보기로
              확인할 수 있어요.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <Card className="font-mono">
              <p className="text-micro text-mid">붙여넣은 내용</p>
              <pre className="mt-3 overflow-x-auto text-[11px] leading-relaxed text-deep">
                {`2026-09-18  연차  연차  사용  -1
2026-09-07  연차  반차  사용  -0.5
2026-04-06  연차  연차  사용  -2`}
              </pre>
              <p className="mt-4 text-micro text-mid">인식 결과</p>
              <ul className="mt-2 space-y-1.5 text-caption">
                {[
                  ['10.02', '연차', '−1일'],
                  ['09.07', '반차', '−0.5일'],
                  ['04.16', '연차', '−2일'],
                ].map(([date, type, amount]) => (
                  <li key={date} className="flex items-center gap-2.5">
                    <span className="tabular-nums">{date}</span>
                    <span className="rounded-[36px] bg-citrus px-2 py-0.5 text-micro">{type}</span>
                    <span className="ml-auto tabular-nums">{amount}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </div>
      </Band>

      {/* 데이터 */}
      <Band tone="gray">
        <Reveal>
          <div className="mx-auto max-w-[620px] text-center">
            <h2 className="text-subheading font-semibold tracking-[0.007em] md:text-heading-sm">내 데이터는 내 브라우저에만.</h2>
            <p className="mt-4 text-body-sm text-mid">
              서버에 저장하지 않습니다. 입력한 연차와 지원비는 이 브라우저 안에만 남고 어디로도 전송되지 않아요. 급여·평가 같은 민감정보는 처음부터
              다루지 않습니다.
            </p>
          </div>
        </Reveal>
      </Band>

      {/* 마무리 */}
      <Band inner="py-24 md:py-32">
        <Reveal>
          <div className="flex flex-col items-center text-center">
            <h2 className="text-heading-sm font-bold tracking-[-0.4px] md:text-heading">오늘 뭘 알아야 하는지, 열자마자.</h2>
            <Link to="/" className={`mt-8 ${ctaClass}`}>
              시작하기
            </Link>
            <p className="mt-10 text-micro text-mid">MY OFFICE — 나의 회사생활 정보</p>
          </div>
        </Reveal>
      </Band>
    </div>
  )
}

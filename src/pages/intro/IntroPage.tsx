import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Band, Card } from '@/components/ui'
import CalendarGrid from './CalendarGrid'
import CountUp from './CountUp'
import Reveal from './Reveal'
import { BenefitBreakdown, BenefitMock, BenefitRecent, CalendarMock, DashboardMock, LeaveMock, ProjectMock, RecommendStrip } from './Mocks'
import { ramp, useStageProgress } from './useStageProgress'

/**
 * 소개 페이지. 내비에는 넣지 않고 공유용 링크(/intro)로만 쓴다.
 * three 를 쓰는 히어로가 있어 App 에서 lazy 로 불러온다.
 *
 * 첫 화면은 스크롤 스테이지다 — 캔버스를 sticky 로 붙여두고
 * 스크롤 진행도에 따라 3D 격자와 문구가 차례로 바뀐다.
 * 이후 섹션은 흰색·회색·검정을 번갈아 두어 긴 스크롤에 리듬을 준다.
 */

const FEATURES = [
  {
    en: 'LEAVE.',
    title: '연차',
    body: '총 연차·사용·예정·잔여를 한 화면에서. 반차·반반차까지 0.25일 단위로 계산하고, 기간 연차는 주말과 공휴일을 빼고 차감합니다.',
    mock: <LeaveMock />,
  },
  {
    en: 'BENEFIT.',
    title: '지원비',
    body: '도서·교육·소프트웨어를 통합 지원비로 관리해요. 월별 사용액과 카테고리별 비중을 보여주고, 잔액을 자동으로 계산합니다.',
    mock: <BenefitMock />,
  },
  {
    en: 'CALENDAR.',
    title: '캘린더',
    body: '공휴일·연차·회사 일정·개인 일정을 한 달력에. 회사 휴무일을 등록하면 연차 계산과 추천에 함께 반영됩니다.',
    mock: <CalendarMock />,
  },
  {
    en: 'PROJECTS.',
    title: '프로젝트 바로가기',
    body: '테스트·운영 서버, WBS, 저장소, 디자인 링크를 프로젝트별로 모아둡니다. 자주 쓰는 프로젝트는 대시보드에 고정할 수 있어요.',
    mock: <ProjectMock />,
  },
]

const STEPS = [
  { no: '01', title: '복사', body: '근태관리의 휴가세부내역 표나 지출결의서 목록을 드래그해 복사합니다.' },
  { no: '02', title: '붙여넣기', body: '연차·지원비 페이지의 가져오기 창에 그대로 붙여넣으면 날짜·유형·금액을 알아서 읽습니다.' },
  { no: '03', title: '확인', body: '가져오기 전에 인식 결과를 미리 보여줍니다. 이미 등록된 건은 제외되고, 같은 항목은 하나로 합칠 수 있어요.' },
]

const PRIVACY = [
  ['서버에 저장하지 않습니다', '입력한 연차와 지원비는 이 브라우저 안에만 남고 어디로도 전송되지 않아요.'],
  ['민감정보는 다루지 않습니다', '급여·평가·계좌 같은 정보는 처음부터 서비스 범위에서 제외했습니다.'],
  ['로그인이 없습니다', '계정을 만들 필요 없이 열어서 바로 쓰면 됩니다.'],
]

const ctaClass = 'rounded-pill bg-blue px-7 py-[15px] text-body-sm text-paper transition-colors hover:bg-blue-hover'

export default function IntroPage() {
  const stageRef = useRef<HTMLElement>(null)
  const progress = useStageProgress(stageRef)

  // 스테이지 안의 문구 두 개를 스크롤에 맞춰 교차시킨다 (리렌더 없이 스타일만)
  const introCopyRef = useRef<HTMLDivElement>(null)
  const recommendCopyRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  // 워드마크는 스크롤에 따라 가로로 천천히 흐른다
  const wordmarkRef = useRef<HTMLDivElement>(null)

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

      if (wordmarkRef.current) {
        const r = wordmarkRef.current.getBoundingClientRect()
        const seen = 1 - Math.max(0, Math.min(1, (r.top + r.height) / (window.innerHeight + r.height)))
        wordmarkRef.current.style.transform = `translateX(${(0.5 - seen) * 14}%)`
      }
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [progress])

  return (
    <div className="min-h-dvh bg-paper text-ink">
      {/* 1 — 스크롤 스테이지. 3D 격자가 붙어 있는 동안 문구가 바뀐다 */}
      <section ref={stageRef} className="relative h-[250vh]">
        <div className="sticky top-0 h-dvh overflow-hidden">
          <CalendarGrid className="absolute inset-0 h-full w-full" progressRef={progress} />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%]"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.94) 38%, #ffffff 58%)',
            }}
          />

          <div ref={introCopyRef} className="absolute inset-x-0 bottom-[9vh] flex flex-col items-center px-5 text-center md:bottom-[11vh]">
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

          <div ref={hintRef} className="absolute inset-x-0 bottom-6 flex justify-center">
            <span className="text-micro text-mid">스크롤</span>
          </div>
        </div>
      </section>

      {/* 2 — 추천 결과 */}
      <Band tone="gray" inner="py-20 md:py-28">
        <Reveal>
          <p className="text-center text-caption text-mid">RECOMMENDATION</p>
          <div className="mx-auto mt-8 max-w-[720px]">
            <Card>
              <p className="text-micro font-medium text-ember">추천</p>
              <p className="mt-2 text-subheading font-semibold md:text-heading-sm">9월 23일 (수) 하루만 쓰면</p>
              <p className="mt-2 text-body-sm text-mid">추석 연휴·주말과 이어져 수요일부터 일요일까지 쉴 수 있어요.</p>
              <div className="mt-7">
                <RecommendStrip />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  ['사용 연차', '1일'],
                  ['연속 휴식', '5일'],
                  ['휴식 기간', '09.23 – 09.27'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[16px] bg-canvas p-4">
                    <p className="text-caption text-mid">{label}</p>
                    <p className="mt-1 text-body-sm font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-[720px] grid-cols-3 gap-5 text-center">
          {[
            { to: 1, suffix: '일', label: '사용한 연차' },
            { to: 5, suffix: '일', label: '연속 휴식' },
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

      {/* 2-1 — 지원비 */}
      <Band inner="py-20 md:py-28">
        <Reveal>
          <div className="mx-auto max-w-[560px] text-center">
            <p className="text-caption text-mid">BENEFIT</p>
            <h2 className="mt-3 text-subheading font-semibold tracking-[0.007em] md:text-heading-sm">얼마 남았는지, 어디에 썼는지.</h2>
            <p className="mt-4 text-body-sm text-mid">
              도서·교육·소프트웨어를 따로 세지 않아도 돼요. 총 지원금에서 쓴 만큼 빼고, 카테고리별 비중과 최근 사용을 함께 보여줍니다.
            </p>
          </div>
        </Reveal>
        <div className="mx-auto mt-12 grid max-w-[880px] gap-5 md:grid-cols-5">
          <Reveal className="md:col-span-3">
            <Card tone="gray">
              <BenefitBreakdown />
            </Card>
          </Reveal>
          <Reveal delay={0.1} className="md:col-span-2">
            <Card tone="gray" title="최근 사용">
              <BenefitRecent />
            </Card>
          </Reveal>
        </div>
      </Band>

      {/* 3 — 검정 밴드. 긴 스크롤에 리듬을 준다 */}
      <section className="overflow-hidden bg-ink py-28 text-paper md:py-40">
        <div className="mx-auto max-w-[1200px] px-5 md:px-10">
          <Reveal>
            <p className="text-caption text-paper/50">WHY</p>
            <h2 className="mt-6 max-w-[820px] text-[30px] font-bold leading-[1.3] tracking-[-0.5px] md:text-heading-sm">
              연차는 근태 시스템에, 지원비는 영수증에, 일정은 캘린더에.
              <br />
              <span className="text-paper/50">흩어져 있으니 매번 찾아야 했습니다.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-10 max-w-[520px] text-body-sm text-paper/60">
              MY OFFICE는 기존 시스템을 대체하지 않아요. 각자 자리에 있는 정보 중에서 내가 자주 확인하는 것만 모아 개인 관점으로 보여줍니다.
            </p>
          </Reveal>
        </div>

        <div ref={wordmarkRef} className="mt-20 whitespace-nowrap will-change-transform md:mt-28">
          <span className="text-[clamp(64px,15vw,220px)] font-bold leading-none tracking-[-0.05em] text-paper/10">
            MY OFFICE · MY OFFICE ·
          </span>
        </div>
      </section>

      {/* 4 — 기능. 왼쪽 제목은 붙어 있고 오른쪽만 흐른다 */}
      <Band inner="py-20 md:py-32">
        <div className="md:grid md:grid-cols-[0.8fr_1.2fr] md:gap-16">
          <div className="md:sticky md:top-24 md:h-fit">
            <Reveal>
              <p className="text-caption text-mid">FEATURES</p>
              <h2 className="mt-3 text-heading-sm font-bold tracking-[-0.4px] md:text-heading">
                한 곳에
                <br />
                모아서.
              </h2>
              <p className="mt-5 max-w-[320px] text-body-sm text-mid">
                네 가지 화면이 서로 연결돼 있습니다. 회사 휴무일을 등록하면 연차 계산과 추천이 함께 바뀌는 식으로요.
              </p>
            </Reveal>
          </div>

          <div className="mt-12 space-y-5 md:mt-0">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.05}>
                <Card tone="gray">
                  <p className="text-caption text-mid">{f.en}</p>
                  <p className="mt-1 text-subheading font-semibold">{f.title}</p>
                  <p className="mt-3 text-body-sm text-mid">{f.body}</p>
                  <div className="mt-6">{f.mock}</div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </Band>

      {/* 5 — 대시보드 미리보기 */}
      <Band tone="gray" inner="py-20 md:py-28">
        <Reveal>
          <div className="mx-auto max-w-[560px] text-center">
            <p className="text-caption text-mid">DASHBOARD</p>
            <h2 className="mt-3 text-subheading font-semibold tracking-[0.007em] md:text-heading-sm">열자마자 보이는 화면.</h2>
            <p className="mt-4 text-body-sm text-mid">
              다음 휴가까지 며칠 남았는지가 가장 먼저 보이고, 그 아래에 연차와 지원비 잔액이 이어집니다.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mx-auto mt-12 max-w-[720px]">
            <DashboardMock />
          </div>
        </Reveal>
      </Band>

      {/* 6 — 가져오기 3단계 */}
      <Band inner="py-20 md:py-32">
        <Reveal>
          <p className="text-caption text-mid">IMPORT</p>
          <h2 className="mt-3 max-w-[620px] text-heading-sm font-bold tracking-[-0.4px] md:text-heading">
            근태 시스템의 표도, 지출결의서도
            <br />
            그대로 붙여넣으세요.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.no} delay={i * 0.1}>
              <div className="border-t border-hairline pt-5">
                <p className="text-caption text-mid tabular-nums">{s.no}</p>
                <p className="mt-2 text-body font-semibold">{s.title}</p>
                <p className="mt-3 text-body-sm text-mid">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            <Card tone="gray">
              <p className="text-micro text-mid">붙여넣은 내용</p>
              <pre className="mt-3 overflow-x-auto font-mono text-[11px] leading-relaxed text-deep">
                {`2026-09-18  연차  연차  사용  -1
2026-09-07  연차  반차  사용  -0.5
2026-04-06  연차  연차  사용  -2`}
              </pre>
            </Card>
            <Card tone="gray">
              <p className="text-micro text-mid">인식 결과</p>
              <ul className="mt-3 space-y-2 text-caption">
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
          </div>
        </Reveal>

        {/* 지출결의서 — 세로로 나열된 건을 읽고 같은 항목을 합친다 */}
        <Reveal delay={0.1}>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Card tone="gray">
              <p className="text-micro text-mid">붙여넣은 지출결의서</p>
              <pre className="mt-3 overflow-x-auto font-mono text-[11px] leading-relaxed text-deep">
                {`2026-09-03
Claude Pro 1개월 구독
개인카드 / 20,000원
2026-09-10
Claude Pro 1개월 구독
개인카드 / 20,000원
2026-09-17
Claude Pro 1개월 구독
개인카드 / 20,000원`}
              </pre>
            </Card>
            <Card tone="gray">
              <p className="text-micro text-mid">인식 결과 · 같은 항목 합치기</p>
              <div className="mt-3 flex items-center gap-2.5 text-caption">
                <span className="tabular-nums">09.17</span>
                <span className="rounded-[36px] bg-silver px-2 py-0.5 text-micro">소프트웨어</span>
                <span className="min-w-0 flex-1 truncate">Claude Pro 3개월 구독</span>
                <span className="ml-auto shrink-0 tabular-nums">60,000원</span>
              </div>
              <p className="mt-1.5 pl-[42px] text-micro text-mid">09.03 – 09.17 · 3건 합산</p>
              <p className="mt-4 text-caption text-mid">'개인카드 /' 같은 구분자는 걸러내고, 이름의 개월 수는 더해서 하나로 만듭니다.</p>
            </Card>
          </div>
        </Reveal>
      </Band>

      {/* 7 — 데이터 */}
      <Band tone="gray" inner="py-20 md:py-32">
        <div className="md:grid md:grid-cols-2 md:gap-16">
          <Reveal>
            <p className="text-caption text-mid">PRIVACY</p>
            <h2 className="mt-3 text-heading-sm font-bold tracking-[-0.4px] md:text-heading">
              내 데이터는
              <br />
              내 브라우저에만.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-8 space-y-6 md:mt-2">
              {PRIVACY.map(([title, body]) => (
                <div key={title} className="border-t border-hairline pt-5">
                  <p className="text-body-sm font-medium">{title}</p>
                  <p className="mt-2 text-body-sm text-mid">{body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Band>

      {/* 8 — 마무리 */}
      <section className="overflow-hidden py-28 md:py-40">
        <Reveal>
          <div className="mx-auto flex max-w-[1200px] flex-col items-center px-5 text-center md:px-10">
            <h2 className="text-heading-sm font-bold tracking-[-0.4px] md:text-heading-lg">
              오늘 뭘 알아야 하는지,
              <br />
              열자마자.
            </h2>
            <Link to="/" className={`mt-10 ${ctaClass}`}>
              시작하기
            </Link>
          </div>
        </Reveal>

        <div className="mt-24 flex justify-center px-5 md:mt-32">
          <span className="text-[clamp(48px,12vw,180px)] font-bold leading-none tracking-[-0.05em] text-wash">MY OFFICE</span>
        </div>
        <p className="mt-16 text-center text-micro text-mid">MY OFFICE — 나의 회사생활 정보</p>
      </section>
    </div>
  )
}

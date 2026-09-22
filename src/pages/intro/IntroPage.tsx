import { Link } from 'react-router-dom'
import { Band, Card } from '@/components/ui'
import CalendarGrid from './CalendarGrid'

/**
 * 소개 페이지. 내비에는 넣지 않고 공유용 링크(/intro)로만 쓴다.
 * three 를 쓰는 히어로가 있어 App 에서 lazy 로 불러온다.
 */

const FEATURES = [
  {
    label: 'Leave',
    title: '연차',
    body: '총 연차·사용·예정·잔여를 한 화면에서. 반차·반반차까지 0.25일 단위로 계산하고, 기간 연차는 주말과 공휴일을 빼고 차감합니다.',
  },
  {
    label: 'Benefit',
    title: '지원비',
    body: '도서·교육·소프트웨어를 통합 지원비로 관리해요. 월별 사용액과 카테고리별 비중을 보여주고, 잔액을 자동으로 계산합니다.',
  },
  {
    label: 'Calendar',
    title: '캘린더',
    body: '공휴일·연차·회사 일정·개인 일정을 한 달력에. 회사 휴무일을 등록하면 연차 계산과 추천에 함께 반영됩니다.',
  },
  {
    label: 'Projects',
    title: '프로젝트 바로가기',
    body: '테스트·운영 서버, WBS, 저장소, 디자인 링크를 프로젝트별로 모아둡니다. 자주 쓰는 프로젝트는 대시보드에 고정할 수 있어요.',
  },
]

export default function IntroPage() {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* 격자가 아래쪽에서 흰 배경으로 스며들도록 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[54vh] min-h-[300px] md:h-[60vh]">
          <CalendarGrid className="h-full w-full" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-paper" />
        </div>
        <div className="relative mx-auto max-w-[1200px] px-5 pb-16 pt-[48vh] md:px-10 md:pb-24 md:pt-[56vh]">
          <div className="flex flex-col items-center text-center">
            <p className="text-body-sm text-mid">MY OFFICE</p>
            <h1 className="mt-3 text-[40px] font-bold leading-[1.05] tracking-[-1.2px] md:text-heading-lg">
              회사생활, 이것저것
              <br />
              찾지 말고 한눈에.
            </h1>
            <p className="mt-5 max-w-[520px] text-body-sm text-mid md:text-body">
              남은 연차가 며칠인지, 지원비를 얼마나 썼는지, 다음 휴일이 언제인지. 여기저기 흩어진 정보를 나만의 대시보드에서 확인하세요.
            </p>
            <Link
              to="/"
              className="mt-8 rounded-pill bg-blue px-6 py-[13px] text-body-sm text-paper transition-colors hover:bg-blue-hover"
            >
              대시보드 열기
            </Link>
          </div>
        </div>
      </section>

      {/* 연차 추천 */}
      <Band tone="gray">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="text-caption text-mid">연차 추천</p>
            <h2 className="mt-2 text-subheading font-semibold tracking-[0.007em] md:text-heading-sm">
              하루를 써서
              <br />
              가장 길게 쉬는 법.
            </h2>
            <p className="mt-4 max-w-[460px] text-body-sm text-mid">
              공휴일·주말·회사 휴무일과 이미 쓴 연차를 모두 계산해서, 가장 효율이 좋은 날짜를 순서대로 알려줍니다. 며칠을 쓸지, 어느 기간은
              제외할지도 고를 수 있어요.
            </p>
          </div>
          <Card>
            <p className="text-micro font-medium text-ember">추천</p>
            <p className="mt-2 text-subheading font-semibold">9월 23일 (수)에 연차를 사용하면</p>
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
      </Band>

      {/* 기능 */}
      <Band>
        <h2 className="text-body-lg font-semibold tracking-[0.007em]">한 곳에 모아서.</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {FEATURES.map((f) => (
            <Card key={f.title} tone="gray" eyebrow={f.label} title={f.title}>
              <p className="text-body-sm text-mid">{f.body}</p>
            </Card>
          ))}
        </div>
      </Band>

      {/* 데이터 */}
      <Band tone="gray">
        <div className="mx-auto max-w-[620px] text-center">
          <h2 className="text-subheading font-semibold tracking-[0.007em] md:text-heading-sm">내 데이터는 내 브라우저에만.</h2>
          <p className="mt-4 text-body-sm text-mid">
            서버에 저장하지 않습니다. 입력한 연차와 지원비는 이 브라우저 안에만 남고 어디로도 전송되지 않아요. 급여·평가 같은 민감정보는 처음부터
            다루지 않습니다.
          </p>
          <p className="mt-4 text-caption text-mid">
            근태 시스템의 휴가 내역은 표를 복사해 붙여넣으면 한 번에 가져올 수 있어요.
          </p>
        </div>
      </Band>

      {/* 마무리 */}
      <Band inner="py-20 md:py-28">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-heading-sm font-bold tracking-[-0.4px] md:text-heading">오늘 뭘 알아야 하는지, 열자마자.</h2>
          <Link
            to="/"
            className="mt-8 rounded-pill bg-blue px-6 py-[13px] text-body-sm text-paper transition-colors hover:bg-blue-hover"
          >
            시작하기
          </Link>
          <p className="mt-10 text-micro text-mid">MY OFFICE — 나의 회사생활 정보</p>
        </div>
      </Band>
    </div>
  )
}

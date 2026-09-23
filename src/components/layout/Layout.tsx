import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '@/store/AppContext'
import { cx } from '@/components/ui'
import { ProfileProvider, useOpenProfile } from './ProfileModal'

// 대시보드는 왼쪽 'MY OFFICE' 로고가 같은 곳으로 가므로 메뉴에 두지 않는다
const NAV = [
  { to: '/leave', label: '연차' },
  { to: '/benefit', label: '지원비' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/projects', label: '프로젝트' },
]

/**
 * 44px sticky global nav — 스크롤 시 #fafafc + backdrop blur.
 * 사이드바 없음. 페이지는 Band 로 흰/회색 밴드를 번갈아 구성한다.
 */
export default function Layout() {
  return (
    <ProfileProvider>
      <Shell />
    </ProfileProvider>
  )
}

function Shell() {
  const { state } = useApp()
  const { user } = state
  const openProfile = useOpenProfile()

  // 회사 · 부서 · 직무 중 입력된 것만 이어 붙인다
  const affiliation = [user.company, user.department, user.position].filter(Boolean).join(' · ')

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="sticky top-0 z-40 h-11 bg-faded/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1200px] items-center gap-4 px-5 md:gap-8 md:px-10">
          {/* 로고가 대시보드로 가는 메뉴 역할도 한다 */}
          <NavLink to="/" end title="대시보드" className="shrink-0 whitespace-nowrap text-micro font-semibold tracking-tight">
            MY OFFICE
          </NavLink>
          {/* 좁은 화면에서는 가로 스크롤 — 링크가 줄바꿈되지 않게 한다 */}
          <nav className="no-scrollbar flex flex-1 items-center gap-5 overflow-x-auto md:justify-center md:gap-8">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cx('shrink-0 whitespace-nowrap text-micro transition-colors', isActive ? 'text-ink' : 'text-deep hover:text-ink')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={openProfile}
            className="shrink-0 whitespace-nowrap text-micro text-deep transition-colors hover:text-ink"
            title="내 정보"
          >
            {user.name || '내 정보'}
          </button>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="bg-paper">
        <div className="mx-auto max-w-[1200px] px-5 py-8 text-micro leading-[1.33] text-mid md:px-10">
          <p>MY OFFICE — 나의 회사생활 정보{affiliation && `. ${affiliation}`}</p>
          <p className="mt-1">급여·평가 등 민감정보는 수집하지 않습니다. 데이터는 이 브라우저에만 저장됩니다.</p>
        </div>
      </footer>
    </div>
  )
}

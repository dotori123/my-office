import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * 페이지(pathname)가 바뀌면 맨 위로.
 * React Router 는 스크롤 위치를 그대로 두기 때문에 직접 올려줘야 한다.
 * 같은 페이지 안의 탭 전환(?tab=)은 위치를 유지한다.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

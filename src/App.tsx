import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from '@/store/AppContext'
import Layout from '@/components/layout/Layout'
import ScrollToTop from '@/components/layout/ScrollToTop'
import DashboardPage from '@/pages/DashboardPage'
import LeavePage from '@/pages/leave/LeavePage'
import BenefitPage from '@/pages/benefit/BenefitPage'
import CalendarPage from '@/pages/calendar/CalendarPage'
import ProjectPage from '@/pages/project/ProjectPage'

// 소개 페이지는 three 를 쓰기 때문에 따로 불러온다 — 대시보드 번들이 무거워지지 않도록
const IntroPage = lazy(() => import('@/pages/intro/IntroPage'))

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* 소개 페이지는 내비·레이아웃 없이 단독으로 */}
          <Route
            path="/intro"
            element={
              <Suspense fallback={<div className="min-h-dvh bg-paper" />}>
                <IntroPage />
              </Suspense>
            }
          />
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="leave" element={<LeavePage />} />
            <Route path="benefit" element={<BenefitPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="projects" element={<ProjectPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}

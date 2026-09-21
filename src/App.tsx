import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from '@/store/AppContext'
import Layout from '@/components/layout/Layout'
import ScrollToTop from '@/components/layout/ScrollToTop'
import DashboardPage from '@/pages/DashboardPage'
import LeavePage from '@/pages/leave/LeavePage'
import BenefitPage from '@/pages/benefit/BenefitPage'
import CalendarPage from '@/pages/calendar/CalendarPage'
import ProjectPage from '@/pages/project/ProjectPage'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
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

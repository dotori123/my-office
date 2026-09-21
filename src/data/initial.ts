import type { Benefit, CalendarEvent, Leave, Project, Settings, User } from '@/types'

/**
 * 초기 상태.
 * U+웍스 API 연동 전까지는 사용자가 직접 입력한다 —
 * 사용자 정보는 상단 내비의 '내 정보', 나머지는 각 페이지의 등록 버튼에서.
 */

export const INITIAL_USER: User = {
  id: 'u1',
  name: '',
  company: '',
  department: '',
  position: '',
  joinDate: '',
}

export const INITIAL_SETTINGS: Settings = {
  year: new Date().getFullYear(),
  totalLeave: 0,
  totalBenefit: 0,
}

export const INITIAL_LEAVES: Leave[] = []
export const INITIAL_BENEFITS: Benefit[] = []
export const INITIAL_EVENTS: CalendarEvent[] = []
export const INITIAL_PROJECTS: Project[] = []

export interface User {
  id: string
  name: string
  company: string
  department: string
  position: string
  joinDate: string // YYYY-MM-DD
}

export const LEAVE_TYPES = ['연차', '반차', '반반차', '기타'] as const
export type LeaveType = (typeof LEAVE_TYPES)[number]

export const LEAVE_UNIT: Record<LeaveType, number> = {
  연차: 1,
  반차: 0.5,
  반반차: 0.25,
  기타: 1,
}

export interface Leave {
  id: string
  userId: string
  type: LeaveType
  startDate: string
  endDate: string
  amount: number // 차감 일수
  memo?: string
}

export const BENEFIT_CATEGORIES = ['도서', '교육', '소프트웨어', '기타'] as const
export type BenefitCategory = (typeof BENEFIT_CATEGORIES)[number]

export interface Benefit {
  id: string
  userId: string
  date: string
  name: string
  amount: number
  category: BenefitCategory
  memo?: string
  receipt?: string // 증빙자료 파일명 (프론트 단계에서는 이름만 보관)
}

export type CalendarEventType = 'holiday' | 'company' | 'leave' | 'personal'

export interface CalendarEvent {
  id: string
  userId: string
  title: string
  date: string
  type: CalendarEventType
  memo?: string
  /** 회사 휴무일 여부 (company 타입만 해당) */
  dayOff?: boolean
}

export interface Settings {
  year: number
  totalLeave: number
  totalBenefit: number
}

export const LINK_KINDS = ['test', 'prod', 'wbs', 'repo', 'design', 'docs', 'etc'] as const
export type LinkKind = (typeof LINK_KINDS)[number]

export const LINK_KIND_LABEL: Record<LinkKind, string> = {
  test: '테스트',
  prod: '운영',
  wbs: 'WBS',
  repo: '저장소',
  design: '디자인',
  docs: '문서',
  etc: '기타',
}

export interface ProjectLink {
  id: string
  kind: LinkKind
  label: string
  url: string
}

export interface Project {
  id: string
  userId: string
  name: string
  description?: string
  /** Dashboard 에 노출 */
  pinned?: boolean
  links: ProjectLink[]
}

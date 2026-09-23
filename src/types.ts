export interface User {
  id: string
  name: string
  company: string
  department: string
  position: string
  joinDate: string // YYYY-MM-DD
}

export const LEAVE_TYPES = ['연차', '반차', '반반차', '경조', '기타'] as const
export type LeaveType = (typeof LEAVE_TYPES)[number]

/** 하루당 차감 일수. 경조휴가는 연차와 별개의 유급휴가라 차감하지 않는다 */
export const LEAVE_UNIT: Record<LeaveType, number> = {
  연차: 1,
  반차: 0.5,
  반반차: 0.25,
  경조: 0,
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
  /** 경조휴가 사유 — src/data/familyEvents 의 key */
  eventKey?: string
}

/** 기본 제공 카테고리. 사용자가 직접 입력한 값도 쓸 수 있어 타입은 열어둔다 */
export const BENEFIT_CATEGORIES = ['도서', '교육', '소프트웨어', '자격증', '기타'] as const
export type BenefitCategory = string

/** 여러 건을 하나로 합쳤을 때 남겨 두는 원본 한 건 */
export interface BenefitPart {
  date: string
  name: string
  amount: number
}

export interface Benefit {
  id: string
  userId: string
  date: string
  name: string
  amount: number
  category: BenefitCategory
  memo?: string
  /** 합산 건이면 원본 목록. 내역에서 펼쳐 볼 수 있다 */
  parts?: BenefitPart[]
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

/** 기본 제공 분류. 직접 입력한 값도 쓸 수 있어 타입은 열어둔다 */
export const LINK_KINDS = ['test', 'prod', 'wbs', 'repo', 'design', 'docs', 'etc'] as const
export type LinkKind = string

export const LINK_KIND_LABEL: Record<string, string> = {
  test: '테스트 서버',
  prod: '운영 서버',
  wbs: 'WBS',
  repo: '저장소',
  design: '디자인',
  docs: '문서',
  etc: '기타',
}

/** 배지에 쓸 이름. 직접 입력한 분류는 값 그대로 */
export const linkKindLabel = (kind: string) => LINK_KIND_LABEL[kind] ?? kind

/**
 * 표시 이름이 분류 이름과 사실상 같은지.
 * 예전에는 표시 이름을 비우면 분류 이름으로 채웠던 탓에 '테스트 서버 테스트'처럼 겹쳐 보인다.
 * 띄어쓰기와 끝의 '서버'를 떼고 견줘서 그런 경우를 가린다.
 */
export const sameAsKindLabel = (label: string, kind: string) => {
  const norm = (s: string) => s.replace(/\s/g, '').replace(/서버$/, '')
  return norm(label) === norm(linkKindLabel(kind))
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
  /** 목록에서의 순서. 직접 끌어서 바꾼다 */
  order?: number
  links: ProjectLink[]
}

import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { Benefit, CalendarEvent, Leave, Project, Settings, User } from '@/types'
import { INITIAL_BENEFITS, INITIAL_EVENTS, INITIAL_LEAVES, INITIAL_PROJECTS, INITIAL_SETTINGS, INITIAL_USER } from '@/data/initial'
import { uid } from '@/utils/format'

/**
 * 프론트 단계에서는 사용자가 직접 입력한 값을 localStorage 에 저장한다.
 * 추후 각 action 을 API 호출로 교체하면 됨.
 */

export interface AppState {
  user: User
  settings: Settings
  leaves: Leave[]
  benefits: Benefit[]
  events: CalendarEvent[]
  projects: Project[]
}

type Action =
  | { type: 'leave/add'; payload: Omit<Leave, 'id' | 'userId'> }
  | { type: 'leave/update'; payload: Leave }
  | { type: 'leave/remove'; id: string }
  | { type: 'leave/import'; payload: Omit<Leave, 'id' | 'userId'>[] }
  | { type: 'benefit/add'; payload: Omit<Benefit, 'id' | 'userId'> }
  | { type: 'benefit/update'; payload: Benefit }
  | { type: 'benefit/remove'; id: string }
  | { type: 'benefit/import'; payload: Omit<Benefit, 'id' | 'userId'>[] }
  | { type: 'event/add'; payload: Omit<CalendarEvent, 'id' | 'userId'> }
  | { type: 'event/update'; payload: CalendarEvent }
  | { type: 'event/remove'; id: string }
  | { type: 'project/add'; payload: Omit<Project, 'id' | 'userId'> }
  | { type: 'project/update'; payload: Project }
  | { type: 'project/remove'; id: string }
  | { type: 'project/reorder'; ids: string[] }
  | { type: 'user/update'; payload: Partial<User> }
  | { type: 'settings/update'; payload: Partial<Settings> }
  | { type: 'reset' }
  | { type: 'state/replace'; payload: AppState }

const STORAGE_KEY = 'my-office:v2'

const initialState: AppState = {
  user: INITIAL_USER,
  settings: INITIAL_SETTINGS,
  leaves: INITIAL_LEAVES,
  benefits: INITIAL_BENEFITS,
  events: INITIAL_EVENTS,
  projects: INITIAL_PROJECTS,
}

const byDate = <T extends { date: string }>(a: T, b: T) => b.date.localeCompare(a.date)

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'leave/add':
      return {
        ...state,
        leaves: [...state.leaves, { ...action.payload, id: uid(), userId: state.user.id }].sort((a, b) =>
          b.startDate.localeCompare(a.startDate),
        ),
      }
    case 'leave/update':
      return { ...state, leaves: state.leaves.map((l) => (l.id === action.payload.id ? action.payload : l)) }
    case 'leave/remove':
      return { ...state, leaves: state.leaves.filter((l) => l.id !== action.id) }

    case 'leave/import':
      return {
        ...state,
        leaves: [...state.leaves, ...action.payload.map((l) => ({ ...l, id: uid(), userId: state.user.id }))].sort((a, b) =>
          b.startDate.localeCompare(a.startDate),
        ),
      }

    case 'benefit/add':
      return {
        ...state,
        benefits: [...state.benefits, { ...action.payload, id: uid(), userId: state.user.id }].sort(byDate),
      }
    case 'benefit/update':
      return { ...state, benefits: state.benefits.map((b) => (b.id === action.payload.id ? action.payload : b)) }
    case 'benefit/remove':
      return { ...state, benefits: state.benefits.filter((b) => b.id !== action.id) }

    case 'benefit/import':
      return {
        ...state,
        benefits: [...state.benefits, ...action.payload.map((b) => ({ ...b, id: uid(), userId: state.user.id }))].sort(byDate),
      }

    case 'event/add':
      return {
        ...state,
        events: [...state.events, { ...action.payload, id: uid(), userId: state.user.id }].sort(byDate),
      }
    case 'event/update':
      return { ...state, events: state.events.map((e) => (e.id === action.payload.id ? action.payload : e)) }
    case 'event/remove':
      return { ...state, events: state.events.filter((e) => e.id !== action.id) }

    case 'project/add': {
      const order = Math.max(-1, ...state.projects.map((p) => p.order ?? -1)) + 1
      return { ...state, projects: [...state.projects, { order, ...action.payload, id: uid(), userId: state.user.id }] }
    }
    case 'project/update':
      return { ...state, projects: state.projects.map((p) => (p.id === action.payload.id ? action.payload : p)) }
    case 'project/remove':
      return { ...state, projects: state.projects.filter((p) => p.id !== action.id) }
    case 'project/reorder': {
      const rank = new Map(action.ids.map((id, i) => [id, i]))
      return {
        ...state,
        projects: state.projects.map((p) => (rank.has(p.id) ? { ...p, order: rank.get(p.id) } : p)),
      }
    }

    case 'user/update':
      return { ...state, user: { ...state.user, ...action.payload } }
    case 'settings/update':
      return { ...state, settings: { ...state.settings, ...action.payload } }
    case 'reset':
      return initialState
    // 백업 파일에서 되돌리기 — 빠진 항목은 초기값으로 채운다
    case 'state/replace':
      return { ...initialState, ...action.payload, projects: withOrder(action.payload.projects ?? []) }
    default:
      return state
  }
}

const LEGACY_KEYS = ['my-office:v1'] // 예시 더미 데이터가 들어있던 이전 버전

/** 순서를 정한 적 없는 프로젝트에 지금 보이는 차례대로 번호를 매긴다 (고정 → 이름순) */
const withOrder = (projects: Project[]): Project[] => {
  if (projects.every((p) => p.order != null)) return projects
  const ranked = [...projects].sort(
    (a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false) || a.name.localeCompare(b.name, 'ko'),
  )
  return projects.map((p) => ({ ...p, order: p.order ?? ranked.indexOf(p) }))
}

const load = (): AppState => {
  try {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k))
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = { ...initialState, ...(JSON.parse(raw) as Partial<AppState>) }
      return { ...saved, projects: withOrder(saved.projects) }
    }
  } catch {
    /* 저장 데이터가 깨진 경우 초기 상태로 복구 */
  }
  return { ...initialState, projects: withOrder(initialState.projects) }
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* 저장 실패는 무시 (프라이빗 모드 등) */
    }
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within <AppProvider>')
  return ctx
}

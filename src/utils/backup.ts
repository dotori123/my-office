import type { AppState } from '@/store/AppContext'

/**
 * 데이터 백업 — 앱 상태를 JSON 파일로 내려받고 되돌린다.
 *
 * 데이터가 이 브라우저의 localStorage 에만 있어서
 * 브라우저 데이터를 지우거나 PC 를 바꾸면 사라진다. 그때 되돌릴 수단이다.
 */

const APP_TAG = 'my-office'
const VERSION = 1

interface BackupFile {
  app: string
  version: number
  exportedAt: string
  state: AppState
}

/** 백업에 들어 있는 항목 수 — 되돌리기 전에 확인시켜 준다 */
export const summarize = (s: AppState) => ({
  leaves: s.leaves?.length ?? 0,
  benefits: s.benefits?.length ?? 0,
  events: s.events?.length ?? 0,
  projects: s.projects?.length ?? 0,
  name: s.user?.name ?? '',
})

/** 파일 이름에 쓸 오늘 날짜 */
const stamp = () => new Date().toISOString().slice(0, 10)

/** 앱 상태를 JSON 파일로 내려받는다 */
export function downloadBackup(state: AppState, prefix = APP_TAG) {
  const payload: BackupFile = { app: APP_TAG, version: VERSION, exportedAt: new Date().toISOString(), state }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${prefix}-backup-${stamp()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  // 곧바로 지우면 일부 브라우저에서 내려받기가 끊긴다
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const isArray = (v: unknown) => Array.isArray(v)

/**
 * 백업 파일을 읽어 앱 상태로 만든다.
 * 내보내기로 만든 파일과, localStorage 값을 그대로 복사한 것 모두 받아들인다.
 */
export function parseBackup(text: string): { state: AppState } | { error: string } {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { error: 'JSON 파일이 아니에요.' }
  }
  if (!raw || typeof raw !== 'object') return { error: '읽을 수 있는 내용이 없어요.' }

  // 내보내기 파일이면 state 안에, localStorage 값을 그대로 옮겼으면 최상위에 있다
  const candidate = ('state' in raw ? (raw as BackupFile).state : raw) as Partial<AppState>
  if (!candidate || typeof candidate !== 'object') return { error: '읽을 수 있는 내용이 없어요.' }

  const missing = (['leaves', 'benefits', 'events', 'projects'] as const).filter((k) => !isArray(candidate[k]))
  if (!candidate.user || !candidate.settings || missing.length) {
    return { error: 'MY OFFICE 백업 파일이 아닌 것 같아요.' }
  }

  return { state: candidate as AppState }
}

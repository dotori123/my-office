/**
 * 경조금 및 경조휴가 기준표 (회사 내규, 2025.10.24 기준).
 * 규정이 바뀌면 이 파일만 고치면 된다.
 *
 * - 휴가는 발생일부터 세고, 본인 결혼만 근무일 기준이며 나머지는 토·공휴일을 포함한다
 * - 조사가 근무시간 외에 생기면 익일부터 쓴다
 * - 본인 출산(90일)은 성격이 달라 목록에 두지 않는다
 */

export type FamilyEventGroup = '경사' | '조사'

export interface FamilyEvent {
  key: string
  group: FamilyEventGroup
  label: string
  /** 휴가 일수. 0 이면 경조금만 있고 휴가는 없다 */
  days: number
  /** 일수를 세는 기준 — working 은 주말·공휴일을 건너뛴다 */
  countBy: 'working' | 'calendar'
  /** 경조금 (원). 없으면 휴가만 */
  money?: number
  note?: string
}

export const FAMILY_EVENTS: FamilyEvent[] = [
  // 경사
  { key: 'wedding-self', group: '경사', label: '본인 결혼', days: 5, countBy: 'working', money: 500_000 },
  { key: 'wedding-child', group: '경사', label: '자녀 결혼', days: 1, countBy: 'calendar', money: 300_000, note: '당일' },
  { key: 'wedding-sibling', group: '경사', label: '형제·자매 결혼', days: 1, countBy: 'calendar', money: 100_000, note: '당일' },
  { key: 'wedding-spouse-sibling', group: '경사', label: '배우자 형제·자매 결혼', days: 1, countBy: 'calendar', money: 100_000, note: '당일' },
  { key: 'birth-spouse', group: '경사', label: '배우자 출산', days: 20, countBy: 'calendar', money: 500_000, note: '쌍둥이는 경조금 100만원' },
  { key: 'birthday-parent', group: '경사', label: '부모·배우자 부모 칠순·팔순·구순·상수', days: 0, countBy: 'calendar', money: 200_000, note: '휴가 없음 · 경조금만' },
  // 조사
  { key: 'funeral-spouse', group: '조사', label: '배우자 상', days: 5, countBy: 'calendar', money: 1_000_000 },
  { key: 'funeral-parent', group: '조사', label: '부모·배우자 부모 상', days: 5, countBy: 'calendar', money: 500_000 },
  { key: 'funeral-child', group: '조사', label: '자녀·자녀의 배우자 상', days: 3, countBy: 'calendar', money: 500_000 },
  { key: 'funeral-grandparent', group: '조사', label: '조부모·배우자 조부모 상', days: 3, countBy: 'calendar', money: 100_000 },
  { key: 'funeral-maternal-grandparent', group: '조사', label: '외조부모·배우자 외조부모 상', days: 3, countBy: 'calendar', money: 100_000 },
  { key: 'funeral-sibling', group: '조사', label: '본인·배우자 형제·자매 상', days: 1, countBy: 'calendar' },
  { key: 'funeral-parent-sibling', group: '조사', label: '본인·배우자 부모의 형제·자매 상', days: 1, countBy: 'calendar' },
]

export const FAMILY_EVENT_MAP = new Map(FAMILY_EVENTS.map((e) => [e.key, e]))

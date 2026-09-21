import type { CalendarEventType } from '@/types'

export interface UnifiedEvent {
  id: string
  date: string
  title: string
  type: CalendarEventType
  memo?: string
}

/**
 * UI 크롬은 무채색, 색은 콘텐츠(일정 유형)에만.
 * Apple product finish 파스텔을 유형 색으로 사용 — 텍스트는 항상 #1d1d1f.
 */
export const EVENT_STYLE: Record<CalendarEventType, { label: string; dot: string; chip: string }> = {
  holiday: { label: '공휴일', dot: 'bg-blush', chip: 'bg-blush text-ink' },
  leave: { label: '연차', dot: 'bg-citrus', chip: 'bg-citrus text-ink' },
  company: { label: '회사 일정', dot: 'bg-sky', chip: 'bg-sky text-ink' },
  personal: { label: '개인 일정', dot: 'bg-starlight', chip: 'bg-starlight text-ink' },
}

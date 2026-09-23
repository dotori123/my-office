import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * 새 버전이 받아졌을 때 알려주는 띠.
 *
 * 저절로 새로고침하면 입력하던 내용이 날아갈 수 있어서,
 * 누를 때만 새로고침한다.
 */
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-5 pb-5">
      <div className="flex items-center gap-3 rounded-pill bg-ink px-5 py-3 text-paper shadow-lg">
        <span className="text-caption">새 버전이 준비됐어요.</span>
        <button type="button" onClick={() => void updateServiceWorker(true)} className="text-caption font-medium underline underline-offset-2">
          새로고침
        </button>
        <button type="button" onClick={() => setNeedRefresh(false)} aria-label="닫기" className="text-caption text-paper/60 hover:text-paper">
          ✕
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
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
  const [reloading, setReloading] = useState(false)

  if (!needRefresh) return null

  const refresh = async () => {
    setReloading(true)
    const reload = () => window.location.reload()
    // 새 서비스 워커가 페이지를 넘겨받으면 새로고침한다
    navigator.serviceWorker?.addEventListener('controllerchange', reload, { once: true })
    // 기다리던 서비스 워커에 직접 "이제 넘겨받아"라고 알린다.
    // 라이브러리에만 맡기면 신호가 안 가서, 새로고침해도 옛 버전이 다시 뜰 때가 있었다.
    const waiting = (await navigator.serviceWorker?.getRegistration())?.waiting
    if (waiting) {
      waiting.addEventListener('statechange', () => waiting.state === 'activated' && reload())
      waiting.postMessage({ type: 'SKIP_WAITING' })
    } else {
      void updateServiceWorker(true)
    }
    // 넘겨받는 신호가 오지 않을 때도 있다 (페이지가 서비스 워커 없이 열린 경우 등) — 잠시 뒤 그냥 새로고침
    setTimeout(reload, 3000)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-5 pb-5">
      <div className="flex items-center gap-3 rounded-pill bg-ink px-5 py-3 text-paper shadow-lg">
        <span className="text-caption">새 버전이 준비됐어요.</span>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={reloading}
          className="text-caption font-medium underline underline-offset-2 disabled:no-underline disabled:opacity-60"
        >
          {reloading ? '새로고침 중…' : '새로고침'}
        </button>
        <button type="button" onClick={() => setNeedRefresh(false)} aria-label="닫기" className="text-caption text-paper/60 hover:text-paper">
          ✕
        </button>
      </div>
    </div>
  )
}

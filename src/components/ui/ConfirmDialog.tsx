import type { ReactNode } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

/**
 * 삭제처럼 되돌리기 어려운 동작 앞에 한 번 더 묻는 창.
 * `open` 이 false 면 아무것도 그리지 않으므로 페이지에 항상 두고 상태만 바꾸면 된다.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '삭제',
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  message?: ReactNode
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {message && <p className="mb-6 text-body-sm text-mid">{message}</p>}
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose} autoFocus>
          취소
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

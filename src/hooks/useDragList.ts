import { useState, type DragEvent, type KeyboardEvent } from 'react'

/**
 * 목록을 끌어서 순서를 바꾼다.
 *
 * 손잡이(handleProps)를 누르고 있는 동안만 항목이 draggable 이 되므로,
 * 카드 안의 링크나 버튼을 드래그하려다 순서가 바뀌는 일이 없다.
 * 손잡이에 포커스를 두고 방향키로도 옮길 수 있다.
 *
 *   const drag = useDragList(ids, (next) => dispatch(...))
 *   <li {...drag.itemProps(id)}><button {...drag.handleProps(id)}>⠿</button></li>
 */

const move = (ids: string[], from: number, to: number) => {
  if (from === to || from < 0 || to < 0) return ids
  const next = [...ids]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function useDragList(ids: string[], onReorder: (next: string[]) => void, enabled = true) {
  /** 손잡이를 누르고 있는 항목 — 이 항목만 끌 수 있다 */
  const [armedId, setArmedId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const reset = () => {
    setArmedId(null)
    setDraggingId(null)
    setOverId(null)
  }

  const dropOn = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return reset()
    onReorder(move(ids, ids.indexOf(draggingId), ids.indexOf(targetId)))
    reset()
  }

  const itemProps = (id: string) =>
    enabled
      ? {
          draggable: armedId === id,
          onDragStart: (e: DragEvent) => {
            setDraggingId(id)
            e.dataTransfer.effectAllowed = 'move'
            // 파이어폭스는 데이터가 없으면 드래그를 시작하지 않는다
            e.dataTransfer.setData('text/plain', id)
          },
          onDragOver: (e: DragEvent) => {
            if (!draggingId) return
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
            if (overId !== id) setOverId(id)
          },
          onDrop: (e: DragEvent) => {
            e.preventDefault()
            dropOn(id)
          },
          onDragEnd: reset,
        }
      : {}

  const handleProps = (id: string) =>
    enabled
      ? {
          // 누르고 있는 동안만 항목을 끌 수 있게 한다
          onPointerDown: () => setArmedId(id),
          onPointerUp: () => setArmedId(null),
          onKeyDown: (e: KeyboardEvent) => {
            const delta = e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : 0
            if (!delta) return
            const from = ids.indexOf(id)
            const to = from + delta
            if (to < 0 || to >= ids.length) return
            e.preventDefault()
            onReorder(move(ids, from, to))
          },
        }
      : {}

  return { draggingId, overId, itemProps, handleProps }
}

import { useEffect, useState } from 'react'
import { LINK_KINDS, LINK_KIND_LABEL, linkKindLabel, type LinkKind, type Project, type ProjectLink } from '@/types'
import { useApp } from '@/store/AppContext'
import { Button, DragHandle, Field, Input, Modal, Select, cx } from '@/components/ui'
import { useDragList } from '@/hooks/useDragList'
import { uid } from '@/utils/format'

interface Props {
  open: boolean
  onClose: () => void
  initial?: Project | null
}

const emptyLink = (kind: LinkKind = 'test'): ProjectLink => ({ id: uid(), kind, label: '', url: '' })

/** 기본 제공 분류인지 — 아니면 직접 입력한 것으로 본다 */
const isPreset = (kind: string) => (LINK_KINDS as readonly string[]).includes(kind) && kind !== 'etc'

/**
 * 'example.com' 처럼 스킴이 없으면 https:// 를 붙인다.
 * http/https 만 허용 — javascript: 같은 스킴이 링크로 들어가지 않도록.
 */
const normalizeUrl = (u: string) => {
  const t = u.trim()
  if (!t) return ''
  if (/^https?:\/\//i.test(t)) return t
  return `https://${t.replace(/^[a-z][a-z0-9+.-]*:\/*/i, '')}`
}

export default function ProjectForm({ open, onClose, initial }: Props) {
  const { dispatch } = useApp()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [pinned, setPinned] = useState(false)
  const [links, setLinks] = useState<ProjectLink[]>([])

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setDescription(initial?.description ?? '')
    setPinned(initial?.pinned ?? false)
    setLinks(initial?.links.length ? initial.links.map((l) => ({ ...l })) : [emptyLink('test'), emptyLink('prod'), emptyLink('wbs')])
  }, [open, initial])

  const updateLink = (id: string, patch: Partial<ProjectLink>) => setLinks((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const removeLink = (id: string) => setLinks((ls) => ls.filter((l) => l.id !== id))

  // 링크는 배열 차례대로 보이므로 배열만 바꾸면 된다
  const drag = useDragList(
    links.map((l) => l.id),
    (ids) => setLinks((ls) => ids.map((id) => ls.find((l) => l.id === id)!)),
    links.length > 1,
  )

  const submit = () => {
    const cleaned = links
      .map((l) => ({ ...l, kind: l.kind.trim() || 'etc', label: l.label.trim(), url: normalizeUrl(l.url) }))
      .filter((l) => l.url)
    const payload = { name: name.trim(), description: description.trim() || undefined, pinned, links: cleaned }
    if (initial) dispatch({ type: 'project/update', payload: { ...initial, ...payload } })
    else dispatch({ type: 'project/add', payload })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? '프로젝트 수정' : '프로젝트 등록'}>
      <div className="space-y-5">
        <Field label="프로젝트명">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="설명">
          <Input placeholder="선택" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-caption text-deep">링크</span>
            <button type="button" onClick={() => setLinks((ls) => [...ls, emptyLink('etc')])} className="text-caption text-link hover:underline">
              + 링크 추가
            </button>
          </div>
          <div className="space-y-2">
            {links.map((l) => (
              <div
                key={l.id}
                {...drag.itemProps(l.id)}
                className={cx(
                  'grid grid-cols-[auto_92px_1fr_auto] items-center gap-2 rounded-[16px] bg-canvas p-2 transition-all',
                  drag.draggingId === l.id && 'opacity-40',
                  drag.overId === l.id && drag.draggingId !== l.id && 'ring-2 ring-blue',
                )}
              >
                {links.length > 1 ? <DragHandle {...drag.handleProps(l.id)} /> : <span />}
                <Select
                  value={isPreset(l.kind) ? l.kind : 'etc'}
                  onChange={(e) => updateLink(l.id, { kind: e.target.value === 'etc' ? '' : e.target.value })}
                  className="px-2 py-2 text-caption"
                >
                  {LINK_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k === 'etc' ? '기타 (직접 입력)' : LINK_KIND_LABEL[k]}
                    </option>
                  ))}
                </Select>
                <div className="space-y-1.5">
                  {!isPreset(l.kind) && (
                    <Input
                      placeholder="분류 이름 (비우면 '기타')"
                      value={l.kind}
                      onChange={(e) => updateLink(l.id, { kind: e.target.value })}
                      className="py-2 text-caption"
                    />
                  )}
                  <Input placeholder="꼬리표 (선택)" value={l.label} onChange={(e) => updateLink(l.id, { label: e.target.value })} className="py-2 text-caption" />
                  <Input placeholder="https://" value={l.url} onChange={(e) => updateLink(l.id, { url: e.target.value })} className="py-2 text-caption" />
                </div>
                <button type="button" onClick={() => removeLink(l.id)} className="px-1 text-caption text-mid hover:text-ink" aria-label="링크 삭제">
                  ✕
                </button>
              </div>
            ))}
            {links.length === 0 && <p className="py-2 text-caption text-mid">링크를 추가해 보세요.</p>}
          </div>
          <p className="mt-1.5 text-micro text-mid">
            URL 이 비어 있는 행은 저장되지 않습니다. 꼬리표는 같은 분류가 여러 개일 때만 쓰면 돼요 (예: {linkKindLabel('test')} · 관리자).
            {links.length > 1 && ' 손잡이를 끌어 순서를 바꿀 수 있어요.'}
          </p>
        </div>

        <label className="flex items-center gap-2 text-body-sm">
          <input type="checkbox" className="size-4 accent-blue" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          Dashboard 에 고정
        </label>

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button className="flex-1" onClick={submit} disabled={!name.trim()}>
            {initial ? '저장' : '등록'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

import { useEffect, useState } from 'react'
import { LINK_KINDS, LINK_KIND_LABEL, type LinkKind, type Project, type ProjectLink } from '@/types'
import { useApp } from '@/store/AppContext'
import { Button, Field, Input, Modal, Select } from '@/components/ui'
import { uid } from '@/utils/format'

interface Props {
  open: boolean
  onClose: () => void
  initial?: Project | null
}

const emptyLink = (kind: LinkKind = 'test'): ProjectLink => ({ id: uid(), kind, label: '', url: '' })

/** 'example.com' 처럼 스킴이 없으면 https:// 를 붙인다 */
const normalizeUrl = (u: string) => {
  const t = u.trim()
  if (!t) return ''
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`
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

  const submit = () => {
    const cleaned = links
      .map((l) => ({ ...l, label: l.label.trim() || LINK_KIND_LABEL[l.kind], url: normalizeUrl(l.url) }))
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
              <div key={l.id} className="grid grid-cols-[92px_1fr_auto] gap-2 rounded-[16px] bg-canvas p-2">
                <Select value={l.kind} onChange={(e) => updateLink(l.id, { kind: e.target.value as LinkKind })} className="px-2 py-2 text-caption">
                  {LINK_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {LINK_KIND_LABEL[k]}
                    </option>
                  ))}
                </Select>
                <div className="space-y-1.5">
                  <Input placeholder="표시 이름 (비우면 종류명)" value={l.label} onChange={(e) => updateLink(l.id, { label: e.target.value })} className="py-2 text-caption" />
                  <Input placeholder="https://" value={l.url} onChange={(e) => updateLink(l.id, { url: e.target.value })} className="py-2 text-caption" />
                </div>
                <button type="button" onClick={() => removeLink(l.id)} className="self-center px-1 text-caption text-mid hover:text-ink" aria-label="링크 삭제">
                  ✕
                </button>
              </div>
            ))}
            {links.length === 0 && <p className="py-2 text-caption text-mid">링크를 추가해 보세요.</p>}
          </div>
          <p className="mt-1.5 text-micro text-mid">URL 이 비어 있는 행은 저장되지 않습니다.</p>
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

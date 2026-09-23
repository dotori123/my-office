import { useEffect, useMemo, useState } from 'react'
import type { Project } from '@/types'
import { useApp } from '@/store/AppContext'
import { Badge, Button, Modal, cx } from '@/components/ui'
import { LINK_KIND_LABEL } from '@/types'
import { parseProjects } from '@/utils/parseProjects'
import { KIND_STYLE } from './ProjectCard'

const PLACEHOLDER = `메모장이나 위키에서 프로젝트 목록을 복사해서 붙여넣으세요.
주소가 없는 줄은 프로젝트 이름, 주소가 있는 줄은 그 프로젝트의 링크로 읽어요.

예)
위시드콘 모바일
테스트  https://test.example.com
운영    https://example.com

사내 포털
https://github.com/acme/portal`

export default function ProjectImport({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useApp()
  const { projects } = state

  const [text, setText] = useState('')
  const [excluded, setExcluded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    setText('')
    setExcluded(new Set())
  }, [open])

  /** 이름이 같은 프로젝트가 이미 있으면 겹치는 것으로 본다 */
  const existing = useMemo(() => new Set(projects.map((p) => p.name.trim())), [projects])

  const parsed = useMemo(() => {
    const { rows, skipped } = parseProjects(text)
    return { items: rows.map((r) => ({ ...r, duplicate: existing.has(r.name) })), skipped }
  }, [text, existing])

  const isOn = (row: (typeof parsed.items)[number]) => !row.duplicate && !excluded.has(row.key)
  const selected = parsed.items.filter(isOn)
  const linkCount = selected.reduce((s, r) => s + r.links.length, 0)

  const toggle = (key: string) =>
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const submit = () => {
    const payload: Omit<Project, 'id' | 'userId'>[] = selected.map((r) => ({ name: r.name, links: r.links }))
    if (payload.length) dispatch({ type: 'project/import', payload })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="붙여넣기로 가져오기">
      <div className="space-y-5">
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={7}
            className="w-full resize-y rounded-[12px] border border-hairline bg-paper px-4 py-3 text-caption leading-relaxed text-ink outline-none placeholder:text-mid focus:border-ink focus:ring-2 focus:ring-ink/10"
          />
          <p className="mt-1.5 text-micro text-mid">
            링크 종류는 이름과 주소에서 자동으로 추정해요. 가져온 뒤 수정에서 바꿀 수 있어요.
          </p>
        </div>

        {text.trim() && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-caption text-deep">
                미리보기 <span className="text-mid">{parsed.items.length}개 인식</span>
              </p>
              {selected.length > 0 && (
                <p className="text-caption text-mid">
                  가져올 {selected.length}개 · 링크 {linkCount}개
                </p>
              )}
            </div>

            {parsed.items.length === 0 ? (
              <p className="rounded-[16px] bg-canvas px-4 py-6 text-center text-caption text-mid">인식된 프로젝트가 없어요</p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto rounded-[16px] bg-canvas p-4">
                {parsed.items.map((r) => {
                  const on = isOn(r)
                  return (
                    <li key={r.key} className={cx('rounded-[12px] bg-paper px-3 py-2.5', !on && 'opacity-40')}>
                      <label className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          className="size-4 shrink-0 accent-blue"
                          checked={on}
                          disabled={r.duplicate}
                          onChange={() => toggle(r.key)}
                        />
                        <span className="min-w-0 flex-1 truncate text-caption font-medium text-ink">{r.name}</span>
                        <span className="shrink-0 text-micro text-mid">
                          {r.duplicate ? '이미 있음' : `링크 ${r.links.length}개`}
                        </span>
                      </label>
                      {r.links.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5 pl-6.5">
                          {r.links.map((l) => (
                            <Badge key={l.id} className={KIND_STYLE[l.kind]}>
                              {/* 종류 이름과 링크 이름이 같으면 한 번만 */}
                              {LINK_KIND_LABEL[l.kind] === l.label ? l.label : `${LINK_KIND_LABEL[l.kind]} · ${l.label}`}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}

            {parsed.skipped.length > 0 && (
              <p className="mt-2 truncate text-micro text-ember">
                프로젝트 이름보다 먼저 나온 줄 {parsed.skipped.length}개는 건너뜁니다 — “{parsed.skipped[0]}”
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button className="flex-1" onClick={submit} disabled={selected.length === 0}>
            {selected.length > 0 ? `${selected.length}개 가져오기` : '가져오기'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

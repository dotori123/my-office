import { useMemo, useState } from 'react'
import type { Project } from '@/types'
import { useApp } from '@/store/AppContext'
import { Band, Button, Card, ConfirmDialog, EmptyState, Input, PageHero } from '@/components/ui'
import ProjectCard from './ProjectCard'
import ProjectForm from './ProjectForm'

export default function ProjectPage() {
  const { state, dispatch } = useApp()
  const { projects } = state
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [q, setQ] = useState('')
  const [removing, setRemoving] = useState<Project | null>(null)

  // 고정 → 이름순
  const list = useMemo(() => {
    const kw = q.trim().toLowerCase()
    return [...projects]
      .filter((p) => !kw || p.name.toLowerCase().includes(kw) || p.links.some((l) => l.label.toLowerCase().includes(kw) || l.url.toLowerCase().includes(kw)))
      .sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false) || a.name.localeCompare(b.name, 'ko'))
  }, [projects, q])

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (p: Project) => {
    setEditing(p)
    setFormOpen(true)
  }
  const togglePin = (p: Project) => dispatch({ type: 'project/update', payload: { ...p, pinned: !p.pinned } })

  return (
    <>
      <Band inner="pb-8 pt-14 md:pb-10 md:pt-20">
        <PageHero
          eyebrow="테스트 · 운영 · WBS · 저장소 · 디자인"
          title="프로젝트"
          sub="자주 쓰는 프로젝트의 업무 환경을 등록해 두고, 관련 링크를 한 번에 열어요."
          action={<Button onClick={openNew}>프로젝트 등록</Button>}
        />
        <div className="mx-auto mt-10 max-w-[420px]">
          <Input placeholder="프로젝트 · 링크 검색" value={q} onChange={(e) => setQ(e.target.value)} className="rounded-pill bg-canvas px-5 text-center" />
        </div>
      </Band>

      <Band tone="gray">
        {list.length === 0 ? (
          <Card>
            <EmptyState text={q ? '검색 결과가 없어요' : '등록된 프로젝트가 없어요'} />
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {list.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                action={
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="sm" onClick={() => togglePin(p)}>
                      {p.pinned ? '고정 해제' : '고정'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                      수정
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setRemoving(p)}>
                      삭제
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </Band>

      <ProjectForm open={formOpen} onClose={() => setFormOpen(false)} initial={editing} />
      <ConfirmDialog
        open={removing !== null}
        title="프로젝트 삭제"
        message={removing && `'${removing.name}' 프로젝트와 등록된 링크를 모두 삭제할까요? 삭제한 프로젝트는 되돌릴 수 없어요.`}
        onConfirm={() => removing && dispatch({ type: 'project/remove', id: removing.id })}
        onClose={() => setRemoving(null)}
      />
    </>
  )
}

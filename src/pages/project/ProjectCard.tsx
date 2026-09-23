import { linkKindLabel, sameAsKindLabel, type LinkKind, type Project } from '@/types'
import { Card, cx } from '@/components/ui'

/** 링크 종류별 색 — product finish 파스텔 */
export const KIND_STYLE: Record<string, string> = {
  test: 'bg-sky',
  prod: 'bg-citrus',
  wbs: 'bg-starlight',
  repo: 'bg-silver',
  design: 'bg-blush',
  docs: 'bg-wash',
  etc: 'bg-wash',
}

/** 직접 입력한 분류는 기본색 */
export const kindStyle = (kind: string) => KIND_STYLE[kind] ?? 'bg-wash'

export function LinkPill({ kind, label, url }: { kind: LinkKind; label: string; url: string }) {
  // 분류 이름과 겹치면 굳이 두 번 보여주지 않는다
  const extra = label && !sameAsKindLabel(label, kind) ? label : ''
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={url}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-pill py-1.5 pl-2 text-caption text-ink transition-opacity hover:opacity-80',
        extra ? 'pr-3' : 'pr-2',
        kindStyle(kind),
      )}
    >
      <span className="rounded-pill bg-paper/70 px-1.5 text-micro text-deep">{linkKindLabel(kind)}</span>
      {extra}
      <span aria-hidden className="text-mid">
        ↗
      </span>
    </a>
  )
}

export default function ProjectCard({
  project,
  tone,
  action,
  compact,
}: {
  project: Project
  tone?: 'white' | 'gray'
  action?: React.ReactNode
  /** Dashboard 용 — 설명 생략 */
  compact?: boolean
}) {
  return (
    <Card
      tone={tone}
      // Dashboard 에 올라와 있는 것 자체가 고정됐다는 뜻이라 거기서는 라벨을 생략
      eyebrow={project.pinned && !compact ? '고정됨' : undefined}
      title={project.name}
      action={action}
      className={cx(compact && 'p-6')}
    >
      {!compact && project.description && <p className="-mt-3 mb-4 text-caption text-mid">{project.description}</p>}
      {project.links.length === 0 ? (
        <p className="text-caption text-mid">등록된 링크가 없어요.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {project.links.map((l) => (
            <LinkPill key={l.id} {...l} />
          ))}
        </div>
      )}
    </Card>
  )
}

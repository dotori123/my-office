import { LINK_KINDS, LINK_KIND_LABEL, linkKindLabel, sameAsKindLabel, type LinkKind, type ProjectLink } from '@/types'

/**
 * 메모장·위키에서 복사한 프로젝트 목록을 프로젝트와 링크로 읽는다.
 *
 * URL 이 있는 줄은 링크, 없는 줄은 새 프로젝트 이름으로 본다.
 * 링크 이름은 URL 앞에 남은 글자를 쓰고, 없으면 주소에서 종류를 추측한다.
 *
 * 받아들이는 예
 *   위시드콘 모바일
 *   테스트  https://test.example.com
 *   운영    https://example.com
 *
 *   사내 포털
 *   https://github.com/acme/portal
 */

export interface ParsedProject {
  key: string
  name: string
  links: ProjectLink[]
}

export interface ProjectParseResult {
  rows: ParsedProject[]
  /** 프로젝트 이름을 못 찾아 버린 줄 */
  skipped: string[]
}

const URL_RE = /\bhttps?:\/\/[^\s<>"')\]]+|\bwww\.[^\s<>"')\]]+/i

/** 링크 종류 추측 — 이름과 주소를 함께 본다 */
const KIND_PATTERNS: { re: RegExp; kind: LinkKind }[] = [
  { re: /운영|프로덕션|라이브|실서버|prod|live|production/i, kind: 'prod' },
  { re: /테스트|스테이징|개발서버|검수|qa\b|test|stag|dev\b/i, kind: 'test' },
  { re: /wbs|일정표|공수|간트|gantt/i, kind: 'wbs' },
  { re: /저장소|소스|깃|github|gitlab|bitbucket|\bgit\b|repo/i, kind: 'repo' },
  { re: /디자인|시안|figma|zeplin|adobe|\bxd\b|sketch/i, kind: 'design' },
  { re: /문서|기획|위키|notion|confluence|docs|wiki|drive|sheet/i, kind: 'docs' },
]

const guessKind = (label: string, url: string): LinkKind =>
  KIND_PATTERNS.find((p) => p.re.test(label) || p.re.test(url))?.kind ?? 'etc'

/** 'example.com' 처럼 스킴이 없으면 https:// 를 붙인다 */
const normalizeUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`)

/** 앞뒤에 붙은 목록 기호·구분자를 떼어낸다 */
const clean = (s: string) =>
  s
    .replace(/^[\s\-–—*•·○●▪▶>#\d]+[.)\]]?\s*/, '')
    .replace(/[\s:：|,\-–—]+$/, '')
    .trim()

let seq = 0
const uid = () => `p${Date.now().toString(36)}${(seq++).toString(36)}`

export function parseProjects(text: string): ProjectParseResult {
  const rows: ParsedProject[] = []
  const skipped: string[] = []
  let current: ParsedProject | null = null

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue

    const m = line.match(URL_RE)
    if (!m) {
      // URL 이 없는 줄은 새 프로젝트 이름
      const name = clean(line)
      if (!name) continue
      current = { key: uid(), name, links: [] }
      rows.push(current)
      continue
    }

    const url = normalizeUrl(m[0])
    // URL 을 뺀 나머지가 링크 이름
    const label = clean(line.replace(m[0], ' '))
    const kind = guessKind(label, url)

    if (!current) {
      // 이름 없이 주소부터 나오면 둘 곳이 없다
      skipped.push(line)
      continue
    }
    // 분류와 겹치는 이름은 남겨둘 필요가 없다
    current.links.push({ id: uid(), kind, label: sameAsKindLabel(label, kind) ? '' : label, url })
  }

  // 링크도 이름도 없는 껍데기는 버린다
  return { rows: rows.filter((r) => r.name), skipped }
}

/** 미리보기에서 종류를 바꿀 때 쓸 목록 */
export { LINK_KINDS, LINK_KIND_LABEL, linkKindLabel }

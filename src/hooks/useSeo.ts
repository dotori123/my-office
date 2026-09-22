import { useEffect } from 'react'

/**
 * 페이지별 SEO 메타.
 * SPA 라 index.html 의 태그가 모든 경로에 그대로 실리므로, 라우트가 바뀔 때
 * title · description · canonical · og/twitter 값을 head 에서 직접 바꿔 준다.
 * 절대 URL 은 .env 의 VITE_SITE_URL 을 쓴다.
 */

export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? '').replace(/\/$/, '')
export const SITE_NAME = 'MY OFFICE'

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

export interface SeoProps {
  title: string
  description: string
  /** 경로. '/' 또는 '/intro' 처럼 앞에 슬래시 */
  path: string
  /** 페이지 전용 구조화 데이터 (schema.org JSON-LD). 모듈 상수로 넘길 것 */
  jsonLd?: Record<string, unknown>
}

export function useSeo({ title, description, path, jsonLd }: SeoProps) {
  useEffect(() => {
    const url = `${SITE_URL}${path}`

    document.title = title
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setLink('canonical', url)

    if (!jsonLd) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.page = path
    script.text = JSON.stringify(jsonLd)
    document.head.appendChild(script)
    return () => script.remove()
  }, [title, description, path, jsonLd])
}

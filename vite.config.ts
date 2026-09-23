import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/**
 * seo/ 폴더의 robots.txt · sitemap.xml · llms.txt 를 사이트 루트에 내보낸다.
 * public/ 은 그대로 복사만 되므로, 절대 URL 이 필요한 이 파일들은
 * index.html 처럼 %VITE_SITE_URL% 을 치환해서 내보낸다.
 * 개발 서버에서도 같은 경로로 볼 수 있다.
 */
function seoFiles(): Plugin {
  const files: Record<string, string> = {
    'robots.txt': 'text/plain; charset=utf-8',
    'sitemap.xml': 'application/xml; charset=utf-8',
    'llms.txt': 'text/plain; charset=utf-8',
  }
  let siteUrl = ''

  const render = (name: string) =>
    fs
      .readFileSync(path.resolve(import.meta.dirname, 'seo', name), 'utf8')
      .replaceAll('%VITE_SITE_URL%', siteUrl)
      .replaceAll('%BUILD_DATE%', new Date().toISOString().slice(0, 10))

  return {
    name: 'seo-files',
    configResolved(config) {
      siteUrl = (loadEnv(config.mode, config.root, 'VITE_').VITE_SITE_URL ?? '').replace(/\/$/, '')
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = (req.url ?? '').slice(1).split('?')[0]
        if (!(name in files)) return next()
        res.setHeader('Content-Type', files[name])
        res.end(render(name))
      })
    },
    generateBundle() {
      for (const name of Object.keys(files)) {
        this.emitFile({ type: 'asset', fileName: name, source: render(name) })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    seoFiles(),
    /**
     * 설치해서 앱처럼 쓰고, 네트워크가 없어도 열리게 한다.
     * 매니페스트는 public/site.webmanifest 를 그대로 쓰므로 새로 만들지 않는다.
     * 새 버전은 저절로 새로고침하지 않고 띠로 알려 준다 (UpdatePrompt).
     */
    VitePWA({
      registerType: 'prompt',
      manifest: false,
      includeAssets: ['favicon/**/*'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        // 주소로 바로 들어와도 앱이 뜨게 (SPA)
        navigateFallback: '/index.html',
        // 이 파일들은 앱이 아니라 그대로 내려줘야 한다
        navigateFallbackDenylist: [/^\/(robots\.txt|sitemap\.xml|llms\.txt)$/],
        // OCR 엔진·한국어 데이터는 15MB 라 미리 받아두지 않는다
        globIgnores: ['**/tesseract*/**'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * 소개 페이지 히어로 — 달력 격자.
 *
 * 7×5 타일이 떠 있고, 연휴로 이어지는 덩어리만 파랑으로 솟아오른다.
 * MD 규칙을 지키려고 그림자·조명 없이 평면 재질(MeshBasicMaterial)만 쓴다.
 * three 는 이 라우트에서만 불러오므로 대시보드 번들에는 포함되지 않는다.
 */

const COLS = 7
const ROWS = 5
const GAP = 1.18

const COLOR = {
  tile: 0xe8e8ed, // 평일
  muted: 0xf5f5f7, // 지난달·다음달
  accent: 0x0071e3, // 연휴
}

/** 파랑으로 띄울 타일 — 금·토·일로 이어지는 연휴 한 덩어리 */
const HOLIDAY = new Set([25, 26, 27])
/** 회색보다 더 옅게 둘 타일 — 앞뒤 달 */
const OUTSIDE = new Set([0, 1, 32, 33, 34])

/** 모서리가 둥근 사각형 — 카드의 28px 라운드를 3D 로 옮긴 것 */
function roundedTile(size: number, radius: number, depth: number) {
  const s = new THREE.Shape()
  const h = size / 2
  s.moveTo(-h + radius, -h)
  s.lineTo(h - radius, -h)
  s.quadraticCurveTo(h, -h, h, -h + radius)
  s.lineTo(h, h - radius)
  s.quadraticCurveTo(h, h, h - radius, h)
  s.lineTo(-h + radius, h)
  s.quadraticCurveTo(-h, h, -h, h - radius)
  s.lineTo(-h, -h + radius)
  s.quadraticCurveTo(-h, -h, -h + radius, -h)
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 6 })
}

export default function CalendarGrid({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    camera.position.set(0, -1.6, 15)
    camera.lookAt(0, 0.4, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    host.appendChild(renderer.domElement)
    renderer.domElement.style.display = 'block'

    // 격자 전체를 담는 그룹 — 마우스에 따라 살짝 기운다
    const board = new THREE.Group()
    board.rotation.x = -0.62
    board.rotation.z = 0.06
    scene.add(board)

    const geometry = roundedTile(1, 0.24, 0.14)
    const materials = [COLOR.tile, COLOR.muted, COLOR.accent].map(
      (color) => new THREE.MeshBasicMaterial({ color, transparent: true }),
    )
    const [matTile, matMuted, matAccent] = materials

    const tiles: { mesh: THREE.Mesh; delay: number; holiday: boolean }[] = []
    for (let i = 0; i < COLS * ROWS; i++) {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const holiday = HOLIDAY.has(i)
      const outside = OUTSIDE.has(i)

      const mesh = new THREE.Mesh(geometry, holiday ? matAccent : outside ? matMuted : matTile)
      mesh.position.set((col - (COLS - 1) / 2) * GAP, ((ROWS - 1) / 2 - row) * GAP, 0)
      if (outside) mesh.scale.setScalar(0.92)
      board.add(mesh)
      // 왼쪽 위에서 오른쪽 아래로 물결이 퍼지도록 지연을 준다
      tiles.push({ mesh, delay: (col + row) * 0.18, holiday })
    }

    let pointerX = 0
    let pointerY = 0
    const onPointerMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      pointerX = ((e.clientX - r.left) / r.width - 0.5) * 2
      pointerY = ((e.clientY - r.top) / r.height - 0.5) * 2
    }
    window.addEventListener('pointermove', onPointerMove)

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      // 좁은 화면에서는 뒤로 물러나 격자가 잘리지 않게 한다
      camera.position.z = w < 640 ? 21 : 15
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    const clock = new THREE.Clock()
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const t = reduceMotion ? 1.6 : clock.getElapsedTime()

      for (const { mesh, delay, holiday } of tiles) {
        const wave = Math.sin(t * 0.9 - delay)
        // 연휴 타일만 확실히 솟아오르고, 나머지는 잔잔하게 흔들린다
        mesh.position.z = holiday ? 0.9 + wave * 0.28 : wave * 0.12
        if (holiday) mesh.scale.setScalar(1.04 + wave * 0.02)
      }

      // 마우스를 따라가는 시차 — 아주 약하게
      board.rotation.z = 0.06 + pointerX * 0.05
      board.rotation.x = -0.62 + pointerY * 0.05
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      geometry.dispose()
      materials.forEach((m) => m.dispose())
      renderer.dispose()
      host.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={hostRef} aria-hidden className={className} />
}

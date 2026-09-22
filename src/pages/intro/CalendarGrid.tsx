import { useEffect, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { lerp, ramp } from './useStageProgress'

/**
 * 소개 페이지 히어로 — 달력 격자.
 *
 * 스크롤(progress 0~1)에 따라 세 장면으로 이어진다.
 *   0.00 ~ 0.35  기울어진 격자가 떠 있고 연휴 타일만 솟아 있다
 *   0.35 ~ 0.70  격자가 정면으로 서면서 평일 타일은 뒤로 물러나 흐려지고
 *                연휴 타일 3개가 가운데로 모여 커진다
 *   0.70 ~ 1.00  모인 덩어리가 천천히 멀어지며 다음 섹션에 자리를 내준다
 *
 * MD 규칙대로 조명·그림자 없이 평면 재질만 쓴다.
 * three 는 이 라우트에서만 불러오므로 대시보드 번들에는 들어가지 않는다.
 */

const COLS = 7
const ROWS = 4
const GAP = 1.18

const COLOR = {
  tile: 0xe8e8ed, // 평일
  muted: 0xf5f5f7, // 지난달·다음달
  accent: 0x0071e3, // 연휴
}

/** 파랑으로 띄울 타일 — 금·토·일로 이어지는 연휴 한 덩어리 */
const HOLIDAY = [18, 19, 20]
/** 더 옅게 둘 타일 — 앞뒤 달 */
const OUTSIDE = new Set([0, 1, 26, 27])

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

export default function CalendarGrid({
  className,
  progressRef,
}: {
  className?: string
  /** 스테이지 스크롤 진행도 0~1 */
  progressRef?: RefObject<number>
}) {
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

    const board = new THREE.Group()
    // 화면 위쪽에 자리잡게 — 아래쪽은 문구 자리로 비워둔다
    board.position.y = 1.9
    board.scale.setScalar(0.84)
    scene.add(board)

    const geometry = roundedTile(1, 0.24, 0.14)
    // 타일마다 투명도를 따로 주므로 재질도 따로 만든다
    const materials: THREE.MeshBasicMaterial[] = []
    const tiles: {
      mesh: THREE.Mesh
      material: THREE.MeshBasicMaterial
      home: THREE.Vector2
      target: THREE.Vector2
      delay: number
      holiday: boolean
    }[] = []

    for (let i = 0; i < COLS * ROWS; i++) {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const holidayIndex = HOLIDAY.indexOf(i)
      const holiday = holidayIndex !== -1
      const outside = OUTSIDE.has(i)

      const material = new THREE.MeshBasicMaterial({
        color: holiday ? COLOR.accent : outside ? COLOR.muted : COLOR.tile,
        transparent: true,
      })
      materials.push(material)

      const home = new THREE.Vector2((col - (COLS - 1) / 2) * GAP, ((ROWS - 1) / 2 - row) * GAP)
      // 연휴 타일은 가운데로 모이고, 나머지는 제자리에서 바깥으로 살짝 밀린다
      const target = holiday
        ? new THREE.Vector2((holidayIndex - 1) * 1.55, 0)
        : home.clone().multiplyScalar(1.35)

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(home.x, home.y, 0)
      if (outside) mesh.scale.setScalar(0.92)
      board.add(mesh)
      tiles.push({ mesh, material, home, target, delay: (col + row) * 0.18, holiday })
    }

    let pointerX = 0
    let pointerY = 0
    const onPointerMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      pointerX = ((e.clientX - r.left) / r.width - 0.5) * 2
      pointerY = ((e.clientY - r.top) / r.height - 0.5) * 2
    }
    window.addEventListener('pointermove', onPointerMove)

    let baseZ = 15
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      // 좁은 화면에서는 뒤로 물러나 격자가 잘리지 않게 한다
      baseZ = w < 640 ? 21 : 15
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
      const p = progressRef?.current ?? 0

      const gather = ramp(p, 0.3, 0.7) // 연휴 타일이 모이는 정도
      const exit = ramp(p, 0.72, 1) // 마지막에 멀어지는 정도

      for (const { mesh, material, home, target, delay, holiday } of tiles) {
        const wave = Math.sin(t * 0.9 - delay)

        mesh.position.x = lerp(home.x, target.x, gather)
        mesh.position.y = lerp(home.y, target.y, gather)
        mesh.position.z = holiday ? 0.9 + wave * 0.28 + gather * 1.2 : wave * 0.12 - gather * 2.4

        if (holiday) {
          mesh.scale.setScalar(lerp(1.04 + wave * 0.02, 1.5, gather) * (1 - exit * 0.25))
          material.opacity = 1 - exit
        } else {
          // 평일 타일은 뒤로 물러나며 흐려진다
          material.opacity = lerp(1, 0.08, gather) * (1 - exit)
        }
      }

      // 기울어진 격자 → 정면 → 살짝 멀어짐
      board.rotation.x = lerp(-0.62, -0.06, gather) + pointerY * 0.05 * (1 - gather)
      board.rotation.z = lerp(0.06, 0, gather) + pointerX * 0.05 * (1 - gather)
      camera.position.z = lerp(baseZ, baseZ - 1.6, gather) + exit * 9
      camera.lookAt(0, lerp(0.4, 0, gather), 0)

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
  }, [progressRef])

  return <div ref={hostRef} aria-hidden className={className} />
}

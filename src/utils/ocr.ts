import { createWorker, PSM, type Worker } from 'tesseract.js'

/**
 * 지출결의서 캡처 같은 이미지에서 글자를 읽어 텍스트로 돌려준다.
 * 브라우저 안에서 tesseract.js 로 처리하며, 엔진과 한국어 데이터는 처음 한 번 CDN 에서 받아온다 (~15MB).
 */

let workerPromise: Promise<Worker> | null = null

const getWorker = () => {
  workerPromise ??= createWorker(['kor', 'eng']).then(async (w) => {
    await w.setParameters({
      // 표를 한 덩어리로 보고 줄 단위로 읽어야 한 건이 한 줄로 나온다
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      // 칸 사이의 넓은 간격을 공백 여러 개로 남겨 칸 구분에 쓴다
      preserve_interword_spaces: '1',
    })
    return w
  })
  return workerPromise
}

/** 글자 높이가 이 정도는 되어야 한글을 제대로 읽는다 */
const TARGET_WIDTH = 2400
const PAD = 30

/**
 * 인식률을 위한 전처리.
 * - 화면 캡처는 글자가 작아서 2~4배로 키운다
 * - 표의 테두리 선은 글자와 붙어 오독을 부르므로, 가로·세로로 길게 이어진 어두운 선을 지운다
 */
async function preprocess(image: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(image)
  const scale = Math.min(4, Math.max(1, Math.ceil(TARGET_WIDTH / bitmap.width)))
  const W = bitmap.width * scale + PAD * 2
  const H = bitmap.height * scale + PAD * 2

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const g = canvas.getContext('2d')!
  g.fillStyle = '#fff'
  g.fillRect(0, 0, W, H)
  g.imageSmoothingQuality = 'high'
  g.drawImage(bitmap, PAD, PAD, bitmap.width * scale, bitmap.height * scale)
  bitmap.close()

  const img = g.getImageData(0, 0, W, H)
  const p = img.data
  const dark = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) {
    const lum = 0.299 * p[i * 4] + 0.587 * p[i * 4 + 1] + 0.114 * p[i * 4 + 2]
    dark[i] = lum < 200 ? 1 : 0
  }
  const whiten = (i: number) => {
    p[i * 4] = p[i * 4 + 1] = p[i * 4 + 2] = 255
  }
  for (let y = 0; y < H; y++) {
    let n = 0
    for (let x = 0; x < W; x++) n += dark[y * W + x]
    if (n > W * 0.4) for (let x = 0; x < W; x++) whiten(y * W + x)
  }
  for (let x = 0; x < W; x++) {
    let n = 0
    for (let y = 0; y < H; y++) n += dark[y * W + x]
    if (n > H * 0.4) for (let y = 0; y < H; y++) whiten(y * W + x)
  }
  g.putImageData(img, 0, 0)
  return canvas
}

export async function recognizeImage(image: Blob): Promise<string> {
  const [worker, canvas] = await Promise.all([getWorker(), preprocess(image)])
  const { data } = await worker.recognize(canvas)
  return data.text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n')
}

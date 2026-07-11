import { chromium, type Browser } from 'playwright-core'
import { pxToInch } from './units.js'

/**
 * 헤드리스 export(P12 Phase 3) — 실행 중인 웹 `/print/:id` 페이지를 헤드리스 크로미움으로
 * 렌더해 PDF/PNG를 만든다. 웹 렌더러(React/SVG)를 그대로 인쇄하므로 차트·한글 폰트까지
 * "웹에서 보이는 것 = 산출물"이 성립(ADR-005 WYSIWYG). 자체 벡터 재구현/드리프트 없음.
 */
export interface HeadlessOptions {
  /** 렌더할 web /print 페이지 URL(예: http://localhost:5273/print/deck_1) */
  url: string
  /** 슬라이드 가상 캔버스 픽셀 크기(비율별) */
  canvas: { width: number; height: number }
  /** 페이지 준비/네비게이션 타임아웃(ms) */
  timeoutMs?: number
}

const READY_SELECTOR = '[data-print-ready="1"]'

async function withBrowser<T>(fn: (b: Browser) => Promise<T>): Promise<T> {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  })
  try {
    return await fn(browser)
  } finally {
    await browser.close()
  }
}

/** 덱 → PDF(슬라이드당 1페이지, 실 웹 렌더 인쇄) */
export async function renderDeckToPdf(opts: HeadlessOptions): Promise<Buffer> {
  const timeout = opts.timeoutMs ?? 60_000
  return withBrowser(async (browser) => {
    const page = await browser.newPage()
    await page.goto(opts.url, { waitUntil: 'load', timeout })
    await page.waitForSelector(READY_SELECTOR, { timeout })
    const pdf = await page.pdf({
      width: `${pxToInch(opts.canvas.width)}in`,
      height: `${pxToInch(opts.canvas.height)}in`,
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    })
    return pdf as Buffer
  })
}

/** 덱 → 슬라이드별 PNG 버퍼 배열(각 [data-slide] 요소를 2x로 캡처) */
export async function renderDeckToPngs(opts: HeadlessOptions): Promise<Buffer[]> {
  const timeout = opts.timeoutMs ?? 60_000
  return withBrowser(async (browser) => {
    const page = await browser.newPage({ deviceScaleFactor: 2 })
    await page.setViewportSize({ width: opts.canvas.width, height: opts.canvas.height })
    await page.goto(opts.url, { waitUntil: 'load', timeout })
    await page.waitForSelector(READY_SELECTOR, { timeout })
    const slides = page.locator('[data-slide]')
    const n = await slides.count()
    const out: Buffer[] = []
    for (let i = 0; i < n; i += 1) {
      const buf = await slides.nth(i).screenshot({ type: 'png' })
      out.push(buf as Buffer)
    }
    return out
  })
}

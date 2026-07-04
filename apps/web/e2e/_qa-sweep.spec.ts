import { test, expect } from '@playwright/test'
import fs from 'node:fs'

/**
 * QA 스윕(임시) — 전 페이지를 방문해 가로 오버플로/콘솔 에러 점검 + 전체 스크린샷.
 * 실행: pnpm exec playwright test _qa-sweep.spec.ts
 */
const SHOT = '/private/tmp/claude-501/-Users-hanseungheon/be5f74de-2697-4c0f-86b5-432233a18ce9/scratchpad/qa'

test.beforeAll(() => { fs.mkdirSync(SHOT, { recursive: true }) })

async function checkPage(page: import('@playwright/test').Page, name: string, path: string) {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))
  await page.goto(path, { waitUntil: 'networkidle' }).catch(() => {})
  await page.waitForTimeout(1500)
  // 가로 오버플로(레이아웃 깨짐 신호)
  const overflow = await page.evaluate(() => {
    const el = document.documentElement
    return { scrollW: el.scrollWidth, clientW: el.clientWidth, over: el.scrollWidth - el.clientWidth }
  })
  await page.screenshot({ path: `${SHOT}/${name}.png`, fullPage: true }).catch(() => {})
  const bad = overflow.over > 3
  console.log(`[${name}] ${path} → 가로오버플로 ${overflow.over}px ${bad ? '⚠️깨짐' : 'OK'} | 콘솔에러 ${errors.length}${errors.length ? ' → ' + errors.slice(0, 3).join(' || ') : ''}`)
  return { name, overflow: overflow.over, errors }
}

test('전 페이지 QA 스윕', async ({ page, request }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1440, height: 900 })

  // 에디터/공유용 덱 1개 생성
  const res = await request.post('/api/v1/decks', {
    data: { prompt: 'UIUX 점검용 덱', preset: 'quick', slideCount: 4, language: '한국어', presentationType: 'general' },
  })
  const { data } = (await res.json()) as { data: { deck: { id: string } } }
  const id = data.deck.id

  const results = []
  results.push(await checkPage(page, '01-dashboard', '/'))
  results.push(await checkPage(page, '02-create', '/create'))
  results.push(await checkPage(page, '03-templates', '/templates'))
  results.push(await checkPage(page, '04-brand-kit', '/brand-kit'))
  results.push(await checkPage(page, '05-settings', '/settings'))
  results.push(await checkPage(page, '06-recent', '/recent'))
  results.push(await checkPage(page, '07-editor', `/editor/${id}`))
  results.push(await checkPage(page, '08-share', `/share/${id}`))

  const broken = results.filter((r) => r.overflow > 3)
  const withErrors = results.filter((r) => r.errors.length > 0)
  console.log(`\n=== 요약: 오버플로 ${broken.length}건, 콘솔에러 페이지 ${withErrors.length}건 ===`)
})

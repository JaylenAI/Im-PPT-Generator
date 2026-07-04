import { test, expect } from '@playwright/test'

/**
 * 에디터 AI 도구 메뉴(P10 UI) — 발표자 노트·예상 질문·접근성·번역·리라이트.
 * 메뉴 열림 + 접근성(결정론) + 예상 질문(실 claude) 검증.
 */
test('AI 도구: 메뉴 5종 + 접근성 점수 + 예상 질문', async ({ page, request }) => {
  test.setTimeout(150_000)
  const res = await request.post('/api/v1/decks', {
    data: { prompt: '동아리 지원 사업 발표', preset: 'quick', slideCount: 4, language: '한국어', presentationType: 'general' },
  })
  const { data } = (await res.json()) as { data: { deck: { id: string } } }

  await page.goto(`/editor/${data.deck.id}`)
  await expect(page.getByTestId('editor-canvas').locator('[data-slide-id]')).toBeVisible()

  // 메뉴 열기 → 5종 노출
  await page.getByTestId('ai-tools-btn').click()
  await expect(page.getByTestId('ai-tools-menu')).toBeVisible()
  for (const id of ['notes', 'questions', 'a11y', 'translate', 'rewrite']) {
    await expect(page.getByTestId(`ai-tool-${id}`)).toBeVisible()
  }

  // 접근성 점검(LLM 아님) → 점수 표시
  await page.getByTestId('ai-tool-a11y').click()
  await expect(page.getByTestId('a11y-modal')).toBeVisible()
  const score = Number((await page.getByTestId('a11y-score').textContent())!.trim())
  expect(score).toBeGreaterThanOrEqual(0)
  expect(score).toBeLessThanOrEqual(100)
  await page.getByTestId('a11y-close').click()

  // 예상 질문(실 claude) → 목록
  await page.getByTestId('ai-tools-btn').click()
  await page.getByTestId('ai-tool-questions').click()
  await expect(page.getByTestId('questions-modal')).toBeVisible()
  await expect(page.getByTestId('questions-list').locator('li').first()).toBeVisible({ timeout: 120_000 })
})

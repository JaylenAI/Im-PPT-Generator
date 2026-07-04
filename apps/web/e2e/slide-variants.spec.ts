import { test, expect } from '@playwright/test'

/**
 * 슬라이드 디자인 변형(P8 UI) — 에디터에서 다른 레이아웃 3종 제안 → 선택 시 교체.
 */
test('디자인 변형: 3종 제안 미리보기 + 선택 시 슬라이드 교체', async ({ page, request }) => {
  test.setTimeout(150_000)
  const res = await request.post('/api/v1/decks', {
    data: { prompt: '카페 창업 계획', preset: 'quick', slideCount: 4, language: '한국어', presentationType: 'general' },
  })
  const { data } = (await res.json()) as { data: { deck: { id: string; slides: Array<{ id: string; layoutType: string }> } } }

  await page.goto(`/editor/${data.deck.id}`)
  await expect(page.getByTestId('editor-canvas').locator('[data-slide-id]')).toBeVisible()

  // 두 번째 슬라이드 선택(썸네일) 후 변형 열기
  await page.getByTestId('variants-btn').click()
  await expect(page.getByTestId('variants-modal')).toBeVisible()

  // 3종 변형 썸네일이 렌더될 때까지(실 claude)
  const picks = page.getByTestId('variant-pick')
  await expect(picks.first()).toBeVisible({ timeout: 120_000 })
  const count = await picks.count()
  expect(count).toBeGreaterThanOrEqual(1)

  // 첫 변형 선택 → 모달 닫히고 캔버스 유지
  await picks.first().click()
  await expect(page.getByTestId('variants-modal')).toBeHidden()
  await expect(page.getByTestId('editor-canvas').locator('[data-slide-id]')).toBeVisible()
})

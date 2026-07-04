import { test, expect } from '@playwright/test'

/**
 * P5 — 요소 추가 툴바: 편집 모드에서 텍스트 요소 추가 → 저장 → 새로고침 영속.
 */
test('요소 추가: 텍스트 추가 → 저장 → 새로고침 후 영속', async ({ page, request }) => {
  const res = await request.post('/api/v1/decks', {
    data: { prompt: '요소 추가 테스트', preset: 'quick', slideCount: 3, language: '한국어' },
  })
  const { data } = (await res.json()) as { data: { deck: { id: string } } }

  await page.goto(`/editor/${data.deck.id}`)
  const canvas = page.getByTestId('editor-canvas')
  await expect(canvas.locator('[data-slide-id]')).toBeVisible()
  await page.getByRole('button', { name: '편집', exact: true }).click()

  // 텍스트 요소 추가 → "새 텍스트"가 캔버스에 나타남
  await page.getByTestId('add-text').click()
  await expect(canvas.getByText('새 텍스트')).toBeVisible()

  // 저장 → 새로고침 후 영속
  await page.getByTestId('save-btn').click()
  await expect(page.getByTestId('save-btn')).toBeHidden()
  await page.reload()
  await expect(page.getByTestId('editor-canvas').getByText('새 텍스트')).toBeVisible()
})

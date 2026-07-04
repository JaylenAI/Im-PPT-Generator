import { test, expect } from '@playwright/test'

/**
 * CSV → 차트 덱(P7 UI) — 생성 위저드에서 CSV 붙여넣기 → 차트 덱 즉시 생성(LLM 없음).
 */
test('CSV 가져오기: 데이터 붙여넣기 → 차트 덱 생성 후 에디터 이동', async ({ page }) => {
  await page.goto('/create')

  // CSV 카드 펼치기
  await page.getByTestId('csv-toggle').click()
  await expect(page.getByTestId('csv-input')).toBeVisible()

  // 예시 데이터 넣고 차트 덱 생성
  await page.getByTestId('csv-input').fill('분기,매출\nQ1,120\nQ2,150\nQ3,210\nQ4,340')
  await page.getByTestId('csv-charttype').selectOption('bar')
  await page.getByTestId('csv-make').click()

  // 에디터로 이동 + 차트 슬라이드 렌더
  await expect(page).toHaveURL(/\/editor\//, { timeout: 30_000 })
  await expect(page.getByTestId('editor-canvas').locator('[data-slide-id]')).toBeVisible()
  await expect(page.locator('svg rect').first()).toBeVisible() // 차트 막대
})

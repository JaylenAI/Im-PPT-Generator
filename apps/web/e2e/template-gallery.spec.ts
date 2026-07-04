import { test, expect } from '@playwright/test'

/**
 * 템플릿 갤러리(P11) — 실제 렌더 미리보기 + 카테고리 필터 + 미리보기 모달 + 템플릿 선택 생성.
 */
test('템플릿 갤러리: 미리보기 → 선택 → 생성 위저드에 템플릿 전달', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/templates')

  // 카드가 실제 샘플 슬라이드로 렌더될 때까지(SlideView는 [data-slide-id] 컨테이너)
  const firstCard = page.locator('[data-testid^="tpl-card-"]').first()
  await expect(firstCard).toBeVisible()
  await expect(firstCard.locator('[data-slide-id]').first()).toBeVisible({ timeout: 15_000 })

  // 카테고리 필터(테크) 동작
  await page.getByTestId('tpl-cat-tech').click()
  await expect(page.getByTestId('tpl-card-template-midnight-tech')).toBeVisible()

  // 카드 클릭 → 미리보기 모달 + 썸네일 릴 5장
  await page.getByTestId('tpl-card-template-midnight-tech').click()
  await expect(page.getByTestId('tpl-preview-modal')).toBeVisible()
  await expect(page.getByTestId('tpl-preview-reel').locator('button')).toHaveCount(5)

  // 이 템플릿으로 만들기 → /create?template=...
  await page.getByTestId('tpl-preview-use').click()
  await expect(page).toHaveURL(/\/create\?template=template-midnight-tech/)
  // 생성 위저드에서 템플릿이 선택됨(셀렉트 값)
  await expect(page.locator('select').filter({ hasText: 'Midnight Tech' })).toHaveValue('template-midnight-tech')
})

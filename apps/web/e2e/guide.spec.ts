import { test, expect } from '@playwright/test'

/** P7 Guide Mode — 청중/톤 사전 입력 패널이 토글되고 값을 넣을 수 있다 */
test('가이드 모드: 청중/톤 입력 패널', async ({ page }) => {
  await page.goto('/create')
  await page.getByTestId('guide-toggle').click()
  await expect(page.getByTestId('guide-panel')).toBeVisible()
  await page.getByTestId('guide-audience').fill('임원진')
  await expect(page.getByTestId('guide-audience')).toHaveValue('임원진')
  await page.getByTestId('guide-tone').selectOption('formal')
  await expect(page.getByTestId('guide-tone')).toHaveValue('formal')
})

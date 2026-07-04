import { test, expect } from '@playwright/test'

/**
 * AI 설정 화면(P10 UI) — 모델 연결 표시 + 프롬프트 편집·저장.
 */
test('AI 설정: 모델 목록 + 프롬프트 편집 저장', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByRole('heading', { name: 'AI 설정' })).toBeVisible()

  // 모델 연결 표시
  await expect(page.getByTestId('settings-models')).toBeVisible()

  // 프롬프트 목록 로드 → outline_system 편집
  const prompt = page.getByTestId('prompt-outline_system')
  await expect(prompt).toBeVisible({ timeout: 15_000 })
  await prompt.getByRole('button').first().click() // 펼치기

  const input = page.getByTestId('prompt-outline_system-input')
  await expect(input).toBeVisible()
  await input.fill((await input.inputValue()) + '\n(사용자 조정 테스트)')

  await page.getByTestId('prompt-outline_system-save').click()
  await expect(page.getByTestId('prompt-outline_system-save')).toContainText('저장됨', { timeout: 10_000 })

  // 새로고침 후에도 '수정됨' 배지 유지(영속)
  await page.reload()
  await expect(page.getByTestId('prompt-outline_system')).toContainText('수정됨')
})

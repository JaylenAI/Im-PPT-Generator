import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'

/**
 * P7 — 문서 업로드: 내 자료 프리셋에서 파일 업로드 → 텍스트 추출 → 소스로 추가.
 */
test('문서 업로드 → 추출 → 소스 추가', async ({ page }) => {
  await page.goto('/create')
  await page.getByRole('button', { name: '내 자료', exact: true }).click()

  // 파일 업로드(숨겨진 input) → 추출된 텍스트가 소스로 추가됨
  const fixture = fileURLToPath(new URL('./fixtures/sample.txt', import.meta.url))
  await page.getByTestId('doc-upload').setInputFiles(fixture)

  // 추출된 텍스트가 소스 목록에 나타남(내용 일부 확인)
  await expect(page.getByText(/원격근무 채택률/)).toBeVisible()
  await expect(page.getByText('TEXT')).toBeVisible()
})

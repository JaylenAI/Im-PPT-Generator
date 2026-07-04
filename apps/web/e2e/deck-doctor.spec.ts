import { test, expect } from '@playwright/test'

/**
 * Deck Doctor — 에디터에서 슬라이드 품질 진단(점수 + 개선점).
 * 실 claude로 생성한 덱을 진단 → 점수와 이슈 목록 표시.
 */
test('품질 진단: 에디터에서 점수와 개선점을 보여준다', async ({ page, request }) => {
  const res = await request.post('/api/v1/decks', {
    data: { prompt: '팀 생산성 개선 방안', preset: 'quick', slideCount: 5, language: '한국어', presentationType: 'consulting' },
  })
  const { data } = (await res.json()) as { data: { deck: { id: string } } }

  await page.goto(`/editor/${data.deck.id}`)
  await expect(page.getByTestId('editor-canvas').locator('[data-slide-id]')).toBeVisible()

  // 품질 진단 열기
  await page.getByTestId('doctor-btn').click()
  await expect(page.getByText('품질 진단 (Deck Doctor)')).toBeVisible()

  // 점수(0~100)가 표시됨
  const score = page.getByTestId('doctor-score')
  await expect(score).toBeVisible()
  const scoreVal = Number((await score.textContent())!.trim())
  expect(scoreVal).toBeGreaterThanOrEqual(0)
  expect(scoreVal).toBeLessThanOrEqual(100)

  // 이슈 컨테이너 존재(0건이면 clean 메시지, 있으면 목록)
  await expect(page.getByTestId('doctor-issues')).toBeAttached()

  await page.getByTestId('doctor-close').click()
  await expect(page.getByText('품질 진단 (Deck Doctor)')).toBeHidden()
})

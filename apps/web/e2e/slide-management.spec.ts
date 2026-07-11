import { test, expect } from '@playwright/test'

/**
 * P12 Phase 2 — 슬라이드 단위 관리: 편집 모드 필름스트립에서
 * 추가 / 복제 / 이동 / 삭제 → 저장 → 새로고침 영속을 실 데이터로 검증.
 */
test('슬라이드 관리: 추가·복제·이동·삭제 → 저장 → 새로고침 영속', async ({ page, request }) => {
  const res = await request.post('/api/v1/decks', {
    data: { prompt: '슬라이드 관리 테스트', preset: 'quick', slideCount: 3, language: '한국어' },
  })
  const { data } = (await res.json()) as { data: { deck: { id: string } } }

  await page.goto(`/editor/${data.deck.id}`)
  const canvas = page.getByTestId('editor-canvas')
  await expect(canvas.locator('[data-slide-id]')).toBeVisible()
  await page.getByRole('button', { name: '편집', exact: true }).click()

  const thumbs = page.getByTestId('slide-thumb')
  await expect(thumbs).toHaveCount(3)
  await expect(page.getByText(/슬라이드 1 \/ 3/)).toBeVisible()

  // 추가: active(0) 뒤에 빈 슬라이드 삽입 → 4장, 새 슬라이드가 활성
  await page.getByTestId('add-slide').click()
  await expect(thumbs).toHaveCount(4)
  await expect(page.getByText(/슬라이드 2 \/ 4/)).toBeVisible()
  await expect(canvas.getByText('새 슬라이드')).toBeVisible()

  // 복제: 새 슬라이드(idx 1) 복제 → 5장
  await thumbs.nth(1).hover()
  await page.getByTestId('slide-dup-1').click()
  await expect(thumbs).toHaveCount(5)
  await expect(page.getByText(/슬라이드 3 \/ 5/)).toBeVisible()

  // 이동: 활성 슬라이드(idx 2)를 왼쪽으로 → active가 idx 1로, 내용은 그대로
  await thumbs.nth(2).hover()
  await page.getByTestId('slide-left-2').click()
  await expect(page.getByText(/슬라이드 2 \/ 5/)).toBeVisible()
  await expect(canvas.getByText('새 슬라이드')).toBeVisible()

  // 삭제: 첫 슬라이드 제거 → 4장
  await thumbs.nth(0).hover()
  await page.getByTestId('slide-del-0').click()
  await expect(thumbs).toHaveCount(4)

  // 저장 → 새로고침 후 4장 영속
  await page.getByTestId('save-btn').click()
  await expect(page.getByTestId('save-btn')).toBeHidden()
  await page.reload()
  await expect(page.getByTestId('editor-canvas').locator('[data-slide-id]')).toBeVisible()
  await expect(page.getByTestId('slide-thumb')).toHaveCount(4)
})

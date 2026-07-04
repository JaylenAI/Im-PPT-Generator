import { test, expect } from '@playwright/test'

/**
 * P9 웹 퍼블리싱 — 읽기 전용 공유 뷰어: 덱을 /share/:id로 열면 슬라이드가 렌더됨.
 */
test('공유 뷰어: 읽기 전용으로 전 슬라이드 렌더', async ({ page, request }) => {
  const res = await request.post('/api/v1/decks', {
    data: { prompt: '공유 뷰어 테스트', preset: 'quick', slideCount: 3, language: '한국어' },
  })
  const { data } = (await res.json()) as { data: { deck: { id: string; slides: unknown[] } } }
  const total = data.deck.slides.length

  await page.goto(`/share/${data.deck.id}`)
  await expect(page.getByText('읽기 전용')).toBeVisible()
  // 전 슬라이드가 뷰어에 렌더
  await expect(page.getByTestId('share-slide')).toHaveCount(total)
  // 슬라이드 콘텐츠(data-slide-id)가 실제로 그려짐
  await expect(page.locator('[data-slide-id]').first()).toBeVisible()
  // 링크 복사 버튼 존재
  await expect(page.getByTestId('copy-link')).toBeVisible()
})

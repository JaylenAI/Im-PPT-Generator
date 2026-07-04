import { test, expect } from '@playwright/test'

/**
 * ADR-009 Action Title — Ghost Deck / Titles Test 뷰: 에디터에서 제목만 순서로 점검.
 * 실 claude가 assertion(결론 문장) 제목을 생성 → 논리 골격 통과 표시.
 */
test('제목 논리 점검: assertion 제목이 순서대로 표시되고 논리 통과', async ({ page, request }) => {
  const res = await request.post('/api/v1/decks', {
    data: { prompt: '스타트업 성장 전략', preset: 'standard', slideCount: 4, language: '한국어' },
  })
  const { data } = (await res.json()) as { data: { deck: { id: string; slides: unknown[] } } }

  await page.goto(`/editor/${data.deck.id}`)
  await expect(page.getByTestId('editor-canvas').locator('[data-slide-id]')).toBeVisible()

  // 제목 점검 열기
  await page.getByTestId('ghost-btn').click()
  await expect(page.getByText('제목 논리 점검 (Titles Test)')).toBeVisible()

  // 제목들이 순서대로 렌더(슬라이드 수만큼)
  const items = page.getByTestId('ghost-titles').locator('li')
  await expect(items).toHaveCount(data.deck.slides.length)
  // 첫 제목이 라벨이 아닌 문장(길이로 근사)
  const first = (await items.first().textContent())!.trim()
  expect(first.length).toBeGreaterThan(10)

  await page.getByTestId('ghost-close').click()
  await expect(page.getByText('제목 논리 점검 (Titles Test)')).toBeHidden()
})

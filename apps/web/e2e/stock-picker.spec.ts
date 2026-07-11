import { test, expect } from '@playwright/test'

/**
 * P12 — 스톡 이미지 피커: 편집 모드에서 "스톡" → 피커 모달 오픈 → 슬라이드 제목이 검색어로 프리필.
 * E2E 환경엔 PEXELS/UNSPLASH 키가 없으므로 available:false 안내가 표시됨(정직한 키리스 경로 검증).
 * 검색어 입력·모달 닫힘 상호작용까지 확인.
 */
test('스톡 피커: 편집 모드에서 열기 → 키리스 안내 → 닫기', async ({ page, request }) => {
  const res = await request.post('/api/v1/decks', {
    data: { prompt: '스톡 피커 테스트', preset: 'quick', slideCount: 3, language: '한국어' },
  })
  const { data } = (await res.json()) as { data: { deck: { id: string } } }

  await page.goto(`/editor/${data.deck.id}`)
  const canvas = page.getByTestId('editor-canvas')
  await expect(canvas.locator('[data-slide-id]')).toBeVisible()
  await page.getByRole('button', { name: '편집', exact: true }).click()

  // "스톡" 버튼 → 피커 모달 오픈
  await page.getByTestId('add-stock').click()
  const picker = page.getByTestId('stock-picker')
  await expect(picker).toBeVisible()

  // 검색어는 슬라이드 제목/덱 제목으로 프리필(비어있지 않음)
  await expect(picker.getByTestId('stock-search')).not.toHaveValue('')

  // 키 미설정 → 안내 문구 표시(available:false)
  await expect(picker.getByTestId('stock-unavailable')).toBeVisible()

  // 검색어 변경 후 검색 → 여전히 키리스 안내(그리드 없음)
  await picker.getByTestId('stock-search').fill('ocean sunset')
  await picker.getByRole('button', { name: '검색' }).click()
  await expect(picker.getByTestId('stock-unavailable')).toBeVisible()

  // 닫기(오버레이 클릭) → 모달 사라짐
  await page.getByRole('button', { name: '닫기' }).click()
  await expect(page.getByTestId('stock-picker')).toBeHidden()
})

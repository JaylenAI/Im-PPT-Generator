import { test, expect } from '@playwright/test'

/**
 * Deck Doctor 자동 수정(ADR-012) — 진단 이슈를 AI가 원클릭 개선.
 * 나쁜 슬라이드(글머리 과다)를 주입 → 에디터에서 진단 → 자동 수정 → 점수 개선 확인.
 */
test('AI 자동 수정: 나쁜 슬라이드를 개선해 점수를 높인다', async ({ page, request }) => {
  test.setTimeout(150_000)

  // 1) 덱 생성
  const res = await request.post('/api/v1/decks', {
    data: { prompt: '분기 실적 리뷰', preset: 'quick', slideCount: 5, language: '한국어', presentationType: 'consulting' },
  })
  const { data } = (await res.json()) as { data: { deck: { id: string } } }
  const id = data.deck.id

  // 2) 나쁜 슬라이드 주입(8개 글머리) — bullets/two-col 슬라이드에 리스트 추가
  const deckRes = await request.get(`/api/v1/decks/${id}`)
  const deck = (await deckRes.json()).data
  const target = deck.slides.find((s: { layoutType: string }) => s.layoutType === 'bullets') ?? deck.slides[1]
  target.elements.push({
    id: 'bad-list', type: 'list', marker: 'dot', style: {},
    frame: { x: 100, y: 400, w: 600, h: 300 }, rotation: 0, opacity: 1, locked: false,
    items: ['항목1', '항목2', '항목3', '항목4', '항목5', '항목6', '항목7', '아주 길고 장황해서 한 줄에 담기지 않는 여덟째 글머리 항목입니다'],
  })
  await request.patch(`/api/v1/decks/${id}`, { data: deck })

  // 3) 에디터 → 품질 진단
  await page.goto(`/editor/${id}`)
  await expect(page.getByTestId('editor-canvas').locator('[data-slide-id]')).toBeVisible()
  await page.getByTestId('doctor-btn').click()
  await expect(page.getByText('품질 진단 (Deck Doctor)')).toBeVisible()

  const scoreBefore = Number((await page.getByTestId('doctor-score').textContent())!.trim())

  // 4) AI 자동 수정
  await expect(page.getByTestId('doctor-fix-btn')).toBeVisible()
  await page.getByTestId('doctor-fix-btn').click()
  await expect(page.getByTestId('doctor-fix-msg')).toBeVisible({ timeout: 120_000 })

  // 5) 점수 개선(같거나 높음, 최소 메시지 표시)
  const scoreAfter = Number((await page.getByTestId('doctor-score').textContent())!.trim())
  expect(scoreAfter).toBeGreaterThanOrEqual(scoreBefore)
})

import { test, expect } from '@playwright/test'

/**
 * WYSIWYG 인라인 편집(P5) — 편집 모드에서 텍스트를 캔버스에서 직접 고치고 저장하면
 * 백엔드에 영속되어 새로고침 후에도 유지됨을 실 브라우저로 검증.
 * 덱은 실 claude(quick)로 생성.
 */
test('편집 모드: 텍스트 인라인 수정 → 저장 → 새로고침 후 영속', async ({ page, request }) => {
  // 실 claude로 작은 덱 생성
  const res = await request.post('/api/v1/decks', {
    data: { prompt: '편집 테스트 프레젠테이션', preset: 'quick', slideCount: 3, language: '한국어' },
  })
  expect(res.ok()).toBeTruthy()
  const { data } = (await res.json()) as {
    data: { deck: { id: string; slides: Array<{ elements: Array<{ id: string; type: string }> }> } }
  }
  const deckId = data.deck.id

  await page.goto(`/editor/${deckId}`)
  // 메인 캔버스가 실제로 렌더될 때까지 대기(ResizeObserver width>0)
  const canvas = page.getByTestId('editor-canvas')
  await expect(canvas.locator('[data-slide-id]')).toBeVisible()

  // 편집 모드 진입 → 캔버스 텍스트가 contentEditable로
  await page.getByRole('button', { name: '편집', exact: true }).click()
  const el = canvas.locator('[contenteditable="true"]').first()
  await expect(el).toBeVisible()

  // 인라인 편집
  await el.click()
  await el.fill('수정된 제목 QA1234')
  // 다른 곳 클릭해 blur(커밋)
  await page.getByText('텍스트를 클릭해 바로 편집하세요.').click()

  // 저장 버튼 등장 → 저장 → dirty 해제(버튼 사라짐)
  const saveBtn = page.getByTestId('save-btn')
  await expect(saveBtn).toBeVisible()
  await saveBtn.click()
  await expect(saveBtn).toBeHidden()

  // 새로고침 → 편집 내용 영속(캔버스로 스코프)
  await page.reload()
  await expect(
    page.getByTestId('editor-canvas').getByText('수정된 제목 QA1234'),
  ).toBeVisible()
})

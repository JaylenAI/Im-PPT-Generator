import { test, expect } from '@playwright/test'

/**
 * P5c — 요소 드래그 이동: 선택 → 이동 핸들 드래그 → 위치(X) 변경 → 저장 → 새로고침 영속.
 */
test('드래그로 요소 이동 → 저장 → 새로고침 후 위치 영속', async ({ page, request }) => {
  const res = await request.post('/api/v1/decks', {
    data: { prompt: '드래그 테스트', preset: 'quick', slideCount: 3, language: '한국어' },
  })
  const { data } = (await res.json()) as { data: { deck: { id: string } } }

  await page.goto(`/editor/${data.deck.id}`)
  const canvas = page.getByTestId('editor-canvas')
  await expect(canvas.locator('[data-slide-id]')).toBeVisible()
  await page.getByRole('button', { name: '편집', exact: true }).click()

  // 첫 텍스트 요소 선택 → 속성 패널 X 확인
  await canvas.locator('[contenteditable="true"]').first().click()
  await expect(page.getByText('요소 속성')).toBeVisible()
  const xBefore = Number(await page.getByTestId('prop-x').inputValue())

  // 이동 핸들을 오른쪽/아래로 드래그
  const handle = page.getByTestId('move-handle')
  const box = (await handle.boundingBox())!
  await page.mouse.move(box.x + 5, box.y + 5)
  await page.mouse.down()
  await page.mouse.move(box.x + 120, box.y + 60, { steps: 8 })
  await page.mouse.up()

  // X가 증가(오른쪽 이동)
  const xAfter = Number(await page.getByTestId('prop-x').inputValue())
  expect(xAfter).toBeGreaterThan(xBefore)

  // 저장 → 새로고침 → 위치 영속
  await page.getByTestId('save-btn').click()
  await expect(page.getByTestId('save-btn')).toBeHidden()
  await page.reload()
  await page.getByRole('button', { name: '편집', exact: true }).click()
  await canvas.locator('[contenteditable="true"]').first().click()
  const xReload = Number(await page.getByTestId('prop-x').inputValue())
  expect(xReload).toBe(xAfter)
})

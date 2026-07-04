import { test, expect } from '@playwright/test'

/**
 * ADR-010 발표 유형 선택기 — 유형을 고르면 그 장르의 권장 슬라이드 수/서사가 반영된다.
 * (UI 상호작용만 검증 — 실제 생성은 outline E2E에서 별도 확인)
 */
test('발표 유형 선택: 유형 선택 시 서사·권장 슬라이드 수 반영', async ({ page }) => {
  await page.goto('/create')

  const picker = page.getByTestId('ptype-picker')
  await expect(picker).toBeVisible()

  // 기본은 일반 발표
  const slideInput = page.locator('input[type="number"]')
  await expect(page.getByTestId('ptype-desc')).toContainText('두괄식')

  // PT 면접 선택 → 서사(STAR) + 권장 슬라이드 6
  await page.getByTestId('ptype-interview').click()
  await expect(page.getByTestId('ptype-interview')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('ptype-desc')).toContainText('STAR')
  await expect(slideInput).toHaveValue('6')

  // IR 피치 선택 → 권장 슬라이드 11
  await page.getByTestId('ptype-ir_pitch').click()
  await expect(page.getByTestId('ptype-desc')).toContainText('Kawasaki')
  await expect(slideInput).toHaveValue('11')
})

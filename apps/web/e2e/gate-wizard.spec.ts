import { test, expect } from '@playwright/test'

/**
 * 정밀 프리셋 게이트 흐름 — 입력 → 목차 승인 게이트 → 슬라이드별 계획 게이트.
 * 실 claude로 아웃라인/계획을 생성하므로 시장 공백 차별화 UI가 실제 동작함을 증명.
 * (최종 덱 생성은 api E2E로 별도 검증 — 브라우저 테스트는 게이트까지)
 */
test('정밀 프리셋: 목차 게이트 → 슬라이드별 계획 게이트가 실 claude로 렌더', async ({ page }) => {
  await page.goto('/create')

  // 정밀 프리셋 선택 → 버튼이 "다음: 목차 검토"로 바뀜
  await page.getByRole('button', { name: '정밀', exact: true }).click()
  await expect(page.getByRole('button', { name: /다음: 목차 검토/ })).toBeVisible()

  // 주제 입력 + 슬라이드 3장(비용 절감)
  await page.getByPlaceholder(/클라우드 전환/).fill('원격근무 생산성 3가지 전략')
  await page.locator('input[type=number]').fill('3')
  await page.getByRole('button', { name: /다음: 목차 검토/ }).click()

  // 목차 승인 게이트(실 claude 아웃라인)
  await expect(page.getByText('이 목차로 진행할까요?')).toBeVisible()
  await expect(page.getByText('게이트 1/2 · 목차 승인')).toBeVisible()
  await page.getByRole('button', { name: /목차 승인/ }).click()

  // 슬라이드별 계획 게이트(실 claude 계획) — 차별화 화면
  await expect(page.getByText('각 슬라이드를 이렇게 만들 예정입니다')).toBeVisible()
  await expect(page.getByText('게이트 2/2 · 슬라이드 계획 승인')).toBeVisible()
  // 계획 카드에 의도/내용이 렌더됨
  await expect(page.getByText('의도').first()).toBeVisible()
  await expect(page.getByText('내용').first()).toBeVisible()
})

test('내 자료 프리셋: 소스 입력 UI가 나타나고 자료를 추가할 수 있다', async ({ page }) => {
  await page.goto('/create')
  await page.getByRole('button', { name: '내 자료', exact: true }).click()
  // 소스 입력 섹션 등장
  const srcInput = page.getByPlaceholder(/참고할 텍스트/)
  await expect(srcInput).toBeVisible()
  // 자료 추가
  await srcInput.fill('2024년 원격근무 채택률 42%')
  await page.getByLabel('자료 추가').click()
  await expect(page.getByText('2024년 원격근무 채택률 42%')).toBeVisible()
  await expect(page.getByText('TEXT')).toBeVisible()
})

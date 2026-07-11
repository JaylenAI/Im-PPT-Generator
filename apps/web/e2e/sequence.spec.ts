import { test, expect } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

/**
 * P12 Phase 5 — 템플릿 시퀀스 + 디자인 시스템 20종.
 * 시그니처 시퀀스를 가진 템플릿(template-forest-green, business 흐름)으로 실 claude 생성 →
 * 첫 title·마지막 closing 등 시퀀스가 덱을 형성했는지 확인하고, PDF로 렌더 육안 검증.
 */
const OUT = join(homedir(), 'Desktop', 'QA_P12_sequence')

test('sequence: 시퀀스 템플릿으로 생성 → 흐름 반영 + PDF 렌더', async ({ request }) => {
  mkdirSync(OUT, { recursive: true })
  const res = await request.post('/api/v1/decks', {
    data: {
      prompt: '국내 전기차 시장 성장과 분기별 판매 추이 분석',
      preset: 'quick',
      slideCount: 8,
      language: '한국어',
      templateId: 'template-forest-green', // business 시퀀스 보유
    },
  })
  expect(res.ok()).toBeTruthy()
  const { data } = (await res.json()) as {
    data: { deck: { id: string; templateId: string; slides: Array<{ layoutType: string }> } }
  }
  const deck = data.deck
  expect(deck.templateId).toBe('template-forest-green')
  const layouts = deck.slides.map((s) => s.layoutType)

  // 시퀀스 형성 증거: 첫 슬라이드 title, 마지막 closing(business 흐름의 양 끝)
  expect(layouts[0]).toBe('title')
  expect(layouts[layouts.length - 1]).toBe('closing')
  // 단조롭지 않음 — 최소 3종 이상의 레이아웃
  expect(new Set(layouts).size).toBeGreaterThanOrEqual(3)
  writeFileSync(join(OUT, 'layouts.json'), JSON.stringify(layouts, null, 2))

  // PDF 렌더 — 디자인 시스템 + 시퀀스가 실제로 그려지는지 육안용
  const pdfCreate = await request.post(`/api/v1/decks/${deck.id}/export`, { data: { format: 'pdf' } })
  expect(pdfCreate.ok()).toBeTruthy()
  const { data: pdfMeta } = (await pdfCreate.json()) as { data: { exportId: string } }
  const pdfDl = await request.get(`/api/v1/exports/${pdfMeta.exportId}/download`)
  const pdfBuf = Buffer.from(await pdfDl.body())
  expect(pdfBuf.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  writeFileSync(join(OUT, 'deck.pdf'), pdfBuf)
})

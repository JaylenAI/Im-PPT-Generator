import { test, expect } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

/**
 * P12 Phase 3 — PDF/PNG export: 실행 중인 웹 /print 페이지를 헤드리스로 렌더해
 * PDF(슬라이드당 1페이지)와 슬라이드별 PNG(zip)를 생성. 실 데이터로 다운로드까지 검증.
 * 산출물은 바탕화면 QA_P12_export/에 저장(육안 확인용).
 */
const OUT = join(homedir(), 'Desktop', 'QA_P12_export')

test('export: PDF/PNG 헤드리스 생성 → 다운로드 검증', async ({ request }) => {
  mkdirSync(OUT, { recursive: true })
  const res = await request.post('/api/v1/decks', {
    data: { prompt: 'AI 프레젠테이션 시장 분석과 분기별 성장 차트', preset: 'quick', slideCount: 3, language: '한국어' },
  })
  const { data } = (await res.json()) as { data: { deck: { id: string; slides: unknown[] } } }
  const deckId = data.deck.id
  const slideCount = data.deck.slides.length
  expect(slideCount).toBeGreaterThanOrEqual(3)

  // PDF — %PDF 매직 + application/pdf + 합리적 크기
  const pdfCreate = await request.post(`/api/v1/decks/${deckId}/export`, { data: { format: 'pdf' } })
  expect(pdfCreate.ok()).toBeTruthy()
  const { data: pdfMeta } = (await pdfCreate.json()) as { data: { exportId: string; filename: string } }
  expect(pdfMeta.filename).toMatch(/\.pdf$/)
  const pdfDl = await request.get(`/api/v1/exports/${pdfMeta.exportId}/download`)
  expect(pdfDl.headers()['content-type']).toContain('application/pdf')
  const pdfBuf = Buffer.from(await pdfDl.body())
  expect(pdfBuf.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  expect(pdfBuf.length).toBeGreaterThan(3000)
  writeFileSync(join(OUT, 'deck.pdf'), pdfBuf)

  // PNG(zip) — PK 매직 + application/zip + 슬라이드별 png 항목명
  const pngCreate = await request.post(`/api/v1/decks/${deckId}/export`, { data: { format: 'png' } })
  expect(pngCreate.ok()).toBeTruthy()
  const { data: pngMeta } = (await pngCreate.json()) as { data: { exportId: string; filename: string } }
  expect(pngMeta.filename).toMatch(/\.zip$/)
  const pngDl = await request.get(`/api/v1/exports/${pngMeta.exportId}/download`)
  expect(pngDl.headers()['content-type']).toContain('application/zip')
  const zipBuf = Buffer.from(await pngDl.body())
  expect(zipBuf.subarray(0, 2).toString('latin1')).toBe('PK')
  const zipText = zipBuf.toString('latin1')
  expect(zipText).toContain('-01.png')
  expect(zipText).toContain(`-${String(slideCount).padStart(2, '0')}.png`)
  writeFileSync(join(OUT, 'slides.zip'), zipBuf)
})

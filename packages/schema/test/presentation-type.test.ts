import { describe, it, expect } from 'vitest'
import {
  PRESENTATION_TYPES,
  presentationTypeSchema,
  getPresentationType,
  renderScaffold,
  generationConfigSchema,
  resolveGenerationConfig,
} from '../src/index.js'

describe('발표 유형 카탈로그(ADR-010)', () => {
  it('발표 유형 카탈로그의 각 항목이 스키마를 만족한다', () => {
    const ids = PRESENTATION_TYPES.map((t) => t.id)
    // 핵심 6종 + 확장 4종
    expect(ids).toEqual([
      'general', 'interview', 'consulting', 'ir_pitch', 'academic', 'sales',
      'lecture', 'workshop', 'business_review', 'product_demo',
    ])
    for (const t of PRESENTATION_TYPES) {
      expect(() => presentationTypeSchema.parse(t)).not.toThrow()
      // 골격은 최소 3비트 이상, defaultSlides는 범위 안
      expect(t.structure.length).toBeGreaterThanOrEqual(3)
      expect(t.defaultSlides).toBeGreaterThanOrEqual(t.slideRange[0])
      expect(t.defaultSlides).toBeLessThanOrEqual(t.slideRange[1])
    }
  })

  it('getPresentationType은 없는 id에 general로 폴백', () => {
    expect(getPresentationType('interview').label).toBe('PT 면접')
    // @ts-expect-error 런타임 폴백 검증
    expect(getPresentationType('nope').id).toBe('general')
  })

  it('renderScaffold는 서사·골격·톤·디자인을 프롬프트 텍스트로 렌더', () => {
    const s = renderScaffold(getPresentationType('interview'))
    expect(s).toContain('STAR')
    expect(s).toContain('오프닝')
    expect(s).toContain('입사 후 기여')
    expect(s).toMatch(/디자인 방향:/)
  })

  it('generationConfig에 presentationType이 흐르고 기본은 general', () => {
    expect(generationConfigSchema.parse({ prompt: 'x' }).presentationType).toBe('general')
    const cfg = resolveGenerationConfig({ prompt: 'x', presentationType: 'ir_pitch' })
    expect(cfg.presentationType).toBe('ir_pitch')
  })
})

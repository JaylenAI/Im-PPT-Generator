import { describe, expect, it } from 'vitest'
import { deckSchema, resolveGenerationConfig, slideElementSchema } from '@im-ppt/schema'
import { createDefaultRegistry, PromptStore, generateDeck } from '../src/index.js'

/**
 * 실 claude -p 풀 덱 생성 통합 테스트(목 금지). 기본 skip,
 * RUN_LLM_INTEGRATION=1 로 실행. 여러 레이아웃을 실제로 채우므로 시간이 걸림.
 */
const RUN = process.env.RUN_LLM_INTEGRATION === '1'

describe.skipIf(!RUN)('generateDeck (실 claude -p, 풀 파이프라인)', () => {
  it('프롬프트 → 아웃라인 → 슬라이드 → 덱을 실제로 생성', async () => {
    const config = resolveGenerationConfig({
      prompt: '중소기업을 위한 클라우드 전환 전략',
      preset: 'quick',
      slideCount: 5,
      language: '한국어',
    })
    const { deck, costUsd } = await generateDeck(config, {
      registry: createDefaultRegistry(),
      prompts: new PromptStore(),
    })

    expect(deckSchema.safeParse(deck).success).toBe(true)
    expect(deck.slides.length).toBeGreaterThanOrEqual(3)
    expect(deck.title.length).toBeGreaterThan(0)

    // 모든 슬라이드의 모든 요소가 유효 + 캔버스 내
    for (const slide of deck.slides) {
      expect(slide.elements.length).toBeGreaterThan(0)
      for (const el of slide.elements) {
        expect(slideElementSchema.safeParse(el).success).toBe(true)
        expect(el.frame.x + el.frame.w).toBeLessThanOrEqual(1280)
        expect(el.frame.y + el.frame.h).toBeLessThanOrEqual(720)
      }
    }
    console.log(`생성된 덱: ${deck.slides.length}장, 비용 $${costUsd.toFixed(3)}`)
  })
})

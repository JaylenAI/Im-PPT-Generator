import { describe, expect, it } from 'vitest'
import { outlineSchema, resolveGenerationConfig } from '@im-ppt/schema'
import { createDefaultRegistry, PromptStore, generateOutline } from '../src/index.js'

/**
 * 실 claude CLI 통합 테스트 — 목 금지 원칙(TESTING_STRATEGY). 기본은 skip,
 * `RUN_LLM_INTEGRATION=1 pnpm -F @im-ppt/core test`로 실행(구독 사용).
 */
const RUN = process.env.RUN_LLM_INTEGRATION === '1'

describe.skipIf(!RUN)('generateOutline (실 claude -p)', () => {
  it('주제로부터 스키마 통과하는 아웃라인을 생성', async () => {
    const config = resolveGenerationConfig({
      prompt: '스타트업을 위한 AI 도입 전략',
      preset: 'standard',
      slideCount: 8,
      language: '한국어',
    })
    const { outline } = await generateOutline(config, {
      registry: createDefaultRegistry(),
      prompts: new PromptStore(),
    })
    expect(outlineSchema.safeParse(outline).success).toBe(true)
    expect(outline.sections.length).toBeGreaterThanOrEqual(3)
    // 모든 layoutHint가 실제 레이아웃 키여야(정규화 확인)
    for (const s of outline.sections) {
      expect(s.id).toMatch(/^section_/)
      expect(s.title.length).toBeGreaterThan(0)
    }
  })
})

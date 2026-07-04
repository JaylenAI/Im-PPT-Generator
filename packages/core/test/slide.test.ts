import { describe, expect, it } from 'vitest'
import { resolveGenerationConfig, slideSchema, deckSchema } from '@im-ppt/schema'
import {
  ProviderRegistry,
  PromptStore,
  generateSlide,
  generateDeck,
  type ModelConnection,
  type ProviderAdapter,
} from '../src/index.js'

const conn: ModelConnection = {
  id: 'c', name: 'c', provider: 'claude-cli', model: 'sonnet',
  tags: ['slide', 'outline'], params: { adminOnly: false }, isActive: true,
}

/** 레이아웃 contentSchema에 맞는 고정 콘텐츠를 반환하는 가짜 프로바이더(offline) */
function fake(data: unknown): ProviderAdapter {
  return { kind: 'claude-cli', generateStructured: async () => ({ data }) }
}

function registryWith(data: unknown): ProviderRegistry {
  return new ProviderRegistry().registerProvider(fake(data)).registerConnection(conn)
}

const cfg = resolveGenerationConfig({ prompt: 'AI 도입 전략', preset: 'quick', slideCount: 3 })

describe('generateSlide', () => {
  it('title 레이아웃 콘텐츠로 절대좌표 슬라이드를 조립', async () => {
    const deps = {
      registry: registryWith({ title: 'AI 도입 전략', subtitle: '2026 로드맵' }),
      prompts: new PromptStore(),
    }
    const { slide } = await generateSlide({
      config: cfg,
      section: { id: 's1', title: 'AI 도입 전략', summary: '표지', layoutHint: 'title', factIds: [] },
      deps,
    })
    expect(slideSchema.safeParse(slide).success).toBe(true)
    expect(slide.layoutType).toBe('title')
    expect(slide.status).toBe('draft')
    expect(slide.elements.length).toBeGreaterThan(0)
    // 모든 요소가 캔버스 안(오버플로 금지)
    for (const el of slide.elements) {
      expect(el.frame.x + el.frame.w).toBeLessThanOrEqual(1280)
      expect(el.frame.y + el.frame.h).toBeLessThanOrEqual(720)
    }
  })

  it('LLM 출력이 레이아웃 스키마 위반이면 실패(레이아웃=계약)', async () => {
    const deps = { registry: registryWith({ wrong: 'shape' }), prompts: new PromptStore() }
    await expect(
      generateSlide({
        config: cfg,
        section: { id: 's1', title: 'T', summary: '', layoutHint: 'title', factIds: [] },
        deps,
      }),
    ).rejects.toThrow()
  })
})

describe('generateDeck (사전 아웃라인 + offline)', () => {
  it('아웃라인 섹션 수만큼 슬라이드를 조립하고 덱 스키마를 통과', async () => {
    const bulletsContent = {
      title: '핵심 포인트',
      bullets: ['시장 성장 34%', '경쟁 심화', '규제 리스크'],
    }
    const deps = { registry: registryWith(bulletsContent), prompts: new PromptStore() }
    const outline = {
      status: 'draft' as const,
      sections: [
        { id: 'o1', title: '기회', summary: '왜 지금', layoutHint: 'bullets', factIds: [] },
        { id: 'o2', title: '전략', summary: '방법', layoutHint: 'bullets', factIds: [] },
      ],
    }
    const { deck } = await generateDeck(cfg, deps, { outline })
    expect(deckSchema.safeParse(deck).success).toBe(true)
    expect(deck.slides).toHaveLength(2)
    expect(deck.templateId).toBe('corporate-indigo')
    expect(deck.themeId).toBe('stitch-indigo')
    expect(deck.outline?.status).toBe('approved')
  })
})

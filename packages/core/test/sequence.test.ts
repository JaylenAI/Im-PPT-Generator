import { describe, expect, it } from 'vitest'
import { resolveGenerationConfig } from '@im-ppt/schema'
import type { ProviderAdapter } from '../src/index.js'
import {
  ProviderRegistry,
  PromptStore,
  generateOutline,
  alignLayoutsToSequence,
  layoutSequenceHint,
} from '../src/index.js'

describe('alignLayoutsToSequence — 콘텐츠-안전 정렬', () => {
  const secs = (hints: string[]) => hints.map((h) => ({ layoutHint: h }))

  it('order 없으면 원본 그대로', () => {
    const input = secs(['bullets', 'cards'])
    expect(alignLayoutsToSequence(input, undefined)).toBe(input)
    expect(alignLayoutsToSequence(input, [])).toBe(input)
  })

  it('유연한 슬롯을 positional로 시퀀스에 정렬', () => {
    const out = alignLayoutsToSequence(secs(['bullets', 'bullets', 'bullets']), ['title', 'agenda', 'section'])
    expect(out.map((s) => s.layoutHint)).toEqual(['title', 'agenda', 'section'])
  })

  it('데이터/인용 레이아웃은 존중(덮어쓰지 않음)', () => {
    const out = alignLayoutsToSequence(secs(['bullets', 'chart', 'quote', 'bullets']), ['title', 'agenda', 'section', 'two-col'])
    expect(out.map((s) => s.layoutHint)).toEqual(['title', 'chart', 'quote', 'two-col'])
  })

  it('시퀀스가 데이터 레이아웃을 요구해도 강제하지 않음(빈 차트 방지)', () => {
    const out = alignLayoutsToSequence(secs(['bullets', 'bullets']), ['title', 'chart'])
    // i1의 order='chart'는 RESPECT라 강제 안 함 → 원래 bullets 유지
    expect(out.map((s) => s.layoutHint)).toEqual(['title', 'bullets'])
  })

  it('첫 title·마지막 closing은 유지, 부족하면 순환', () => {
    const out = alignLayoutsToSequence(
      secs(['title', 'bullets', 'bullets', 'bullets', 'closing']),
      ['title', 'agenda', 'section'],
    )
    // i0 title 유지, i1→agenda, i2→section, i3→order[3%3=0]=title, i4 closing 유지
    expect(out.map((s) => s.layoutHint)).toEqual(['title', 'agenda', 'section', 'title', 'closing'])
  })

  it('불변 — 원본 배열/요소를 변형하지 않는다', () => {
    const input = secs(['bullets'])
    const out = alignLayoutsToSequence(input, ['section'])
    expect(input[0]!.layoutHint).toBe('bullets')
    expect(out).not.toBe(input)
  })
})

describe('layoutSequenceHint', () => {
  it('order 없으면 빈 문자열', () => {
    expect(layoutSequenceHint(undefined)).toBe('')
    expect(layoutSequenceHint([])).toBe('')
  })
  it('order 있으면 순서를 담은 안내문', () => {
    const hint = layoutSequenceHint(['title', 'agenda', 'closing'])
    expect(hint).toContain('title → agenda → closing')
    expect(hint).toContain('3종')
  })
})

// generateOutline이 시퀀스 정렬을 실제로 적용하는지 — 페이크 프로바이더로 결정적 검증
function fakeOutlineProvider(hints: string[]): ProviderAdapter {
  return {
    kind: 'claude-cli',
    async generateStructured({ schemaJson }) {
      const props = (schemaJson.properties ?? {}) as Record<string, unknown>
      if ('sections' in props) {
        return {
          data: {
            sections: hints.map((h, i) => ({
              title: `제목${i}`,
              assertion: `주장${i}`,
              summary: `요약${i}`,
              layoutHint: h,
              factIds: [],
            })),
          },
        }
      }
      return { data: {} }
    },
  }
}

function registryWith(hints: string[]): ProviderRegistry {
  return new ProviderRegistry().registerProvider(fakeOutlineProvider(hints)).registerConnection({
    id: 'fake', name: 'fake', provider: 'claude-cli', model: 'sonnet',
    tags: ['outline', 'slide'], params: { adminOnly: false }, isActive: true,
  })
}

describe('generateOutline — 템플릿 시퀀스 적용', () => {
  it('layoutOrder를 주면 유연한 슬롯이 시퀀스로 정렬되고 데이터는 존중된다', async () => {
    const config = resolveGenerationConfig({ prompt: '테스트 주제', preset: 'quick', slideCount: 5 })
    const { outline } = await generateOutline(
      config,
      { registry: registryWith(['bullets', 'bullets', 'chart', 'bullets', 'closing']), prompts: new PromptStore() },
      { layoutOrder: ['title', 'agenda', 'section', 'two-col', 'closing'] },
    )
    expect(outline.sections.map((s) => s.layoutHint)).toEqual([
      'title', 'agenda', 'chart', 'two-col', 'closing',
    ])
  })

  it('layoutOrder 없으면 LLM 선택을 유지(정규화만)', async () => {
    const config = resolveGenerationConfig({ prompt: '테스트 주제', preset: 'quick', slideCount: 3 })
    const { outline } = await generateOutline(
      config,
      { registry: registryWith(['title', 'cards', 'closing']), prompts: new PromptStore() },
      {},
    )
    expect(outline.sections.map((s) => s.layoutHint)).toEqual(['title', 'cards', 'closing'])
  })
})

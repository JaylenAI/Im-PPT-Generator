import { describe, expect, it } from 'vitest'
import {
  CONFIG_PRESETS,
  generationConfigSchema,
  resolveGenerationConfig,
} from '../src/index.js'

describe('generationConfigSchema', () => {
  it('prompt만 주면 나머지를 기본값으로 채운다', () => {
    const c = generationConfigSchema.parse({ prompt: '전기차 시장' })
    expect(c.slideCount).toBe(12)
    expect(c.researchMode).toBe('web')
    expect(c.outlineSource).toBe('ai')
    expect(c.imageMode).toBe('mixed')
    // gates 중첩 기본값이 채워져야 한다 (prefault)
    expect(c.gates).toEqual({ facts: false, outline: true, slidePlan: false })
  })

  it('잘못된 researchMode를 거부한다', () => {
    expect(generationConfigSchema.safeParse({ prompt: 'x', researchMode: 'psychic' }).success).toBe(
      false,
    )
  })

  it('slideCount 범위를 강제한다', () => {
    expect(generationConfigSchema.safeParse({ prompt: 'x', slideCount: 0 }).success).toBe(false)
    expect(generationConfigSchema.safeParse({ prompt: 'x', slideCount: 61 }).success).toBe(false)
  })
})

describe('resolveGenerationConfig — 프리셋 + 오버라이드', () => {
  it('quick 프리셋은 리서치/게이트를 모두 끈다 (L0)', () => {
    const c = resolveGenerationConfig({ prompt: 'x', preset: 'quick' })
    expect(c.researchMode).toBe('off')
    expect(c.gates).toEqual({ facts: false, outline: false, slidePlan: false })
  })

  it('precision 프리셋은 3게이트 전부 켠다 (L3)', () => {
    const c = resolveGenerationConfig({ prompt: 'x', preset: 'precision' })
    expect(c.gates.facts && c.gates.outline && c.gates.slidePlan).toBe(true)
  })

  it('my_materials: 딥서치 스킵하고 제공 자료만 쓴다', () => {
    const c = resolveGenerationConfig({ prompt: 'x', preset: 'my_materials' })
    expect(c.researchMode).toBe('user_only')
  })

  it('오버라이드가 프리셋을 이긴다', () => {
    const c = resolveGenerationConfig({ prompt: 'x', preset: 'standard', researchMode: 'deep' })
    expect(c.researchMode).toBe('deep')
  })

  it('gates 부분 토글 시 나머지 프리셋값을 보존한다 (딥머지)', () => {
    // precision(3게이트 on)에서 slidePlan만 끄면 facts/outline은 유지
    const c = resolveGenerationConfig({
      prompt: 'x',
      preset: 'precision',
      gates: { slidePlan: false },
    })
    expect(c.gates).toEqual({ facts: true, outline: true, slidePlan: false })
  })

  it('사용자가 템플릿/목차를 미리 주면 config에 반영된다 (단계 스킵의 근거)', () => {
    const c = resolveGenerationConfig({
      prompt: 'x',
      templateId: 'corporate-indigo',
      outlineSource: 'user',
      researchMode: 'user_only',
    })
    expect(c.templateId).toBe('corporate-indigo')
    expect(c.outlineSource).toBe('user')
    expect(c.researchMode).toBe('user_only')
  })

  it('모든 프리셋이 유효한 완전 config로 해석된다', () => {
    for (const name of Object.keys(CONFIG_PRESETS)) {
      const c = resolveGenerationConfig({ prompt: 'x', preset: name as keyof typeof CONFIG_PRESETS })
      expect(generationConfigSchema.safeParse(c).success).toBe(true)
    }
  })
})

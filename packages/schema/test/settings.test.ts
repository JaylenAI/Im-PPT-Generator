import { describe, expect, it } from 'vitest'
import { APP_SETTINGS_CATALOG, appSettingsSchema } from '../src/index.js'

describe('appSettingsSchema', () => {
  it('빈 입력 → 합리적 기본값', () => {
    const s = appSettingsSchema.parse({})
    expect(s.defaultPreset).toBe('standard')
    expect(s.defaultSlideCount).toBe(12)
    expect(s.defaultTone).toBe('professional')
    expect(s.defaultLanguage).toBe('ko')
    expect(s.defaultAspectRatio).toBe('16:9')
    expect(s.defaultImageMode).toBe('mixed')
  })

  it('부분 입력을 수용(미지정 필드는 기본값)', () => {
    const s = appSettingsSchema.parse({ defaultLanguage: 'en' })
    expect(s.defaultLanguage).toBe('en')
    expect(s.defaultPreset).toBe('standard') // 미지정 → 기본값
  })

  it('범위 밖 slideCount 거부', () => {
    expect(appSettingsSchema.safeParse({ defaultSlideCount: 0 }).success).toBe(false)
    expect(appSettingsSchema.safeParse({ defaultSlideCount: 61 }).success).toBe(false)
  })
})

describe('APP_SETTINGS_CATALOG (동적 카탈로그)', () => {
  it('카탈로그 키가 스키마 필드와 정확히 일치', () => {
    const schemaKeys = Object.keys(appSettingsSchema.parse({})).sort()
    const catalogKeys = APP_SETTINGS_CATALOG.map((f) => f.key).sort()
    expect(catalogKeys).toEqual(schemaKeys)
  })

  it('enum 필드는 options를 제공', () => {
    for (const f of APP_SETTINGS_CATALOG) {
      if (f.type === 'enum') expect(f.options && f.options.length).toBeGreaterThan(0)
    }
  })

  it('각 필드의 default가 스키마 기본값과 일치', () => {
    const defaults = appSettingsSchema.parse({}) as Record<string, unknown>
    for (const f of APP_SETTINGS_CATALOG) {
      expect(f.default).toEqual(defaults[f.key])
    }
  })
})

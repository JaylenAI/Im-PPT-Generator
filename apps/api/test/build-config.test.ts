import { describe, expect, it } from 'vitest'
import { appSettingsSchema } from '@im-ppt/schema'
import { buildConfig } from '../src/lib/build-config.js'

const app = appSettingsSchema.parse({ defaultLanguage: 'en', defaultSlideCount: 8, defaultTone: 'casual' })

describe('buildConfig 층위(앱 기본값 < 프리셋 < 요청)', () => {
  it('요청이 옵션을 안 주면 앱 기본값을 채운다', () => {
    const cfg = buildConfig(app, { prompt: 'X' })
    expect(cfg.language).toBe('en')
    expect(cfg.slideCount).toBe(8)
    expect(cfg.tone).toBe('casual')
  })

  it('요청 명시값이 앱 기본값을 이긴다', () => {
    const cfg = buildConfig(app, { prompt: 'X', language: 'ko', slideCount: 20 })
    expect(cfg.language).toBe('ko')
    expect(cfg.slideCount).toBe(20)
  })

  it('preset 미지정 시 앱 defaultPreset 사용', () => {
    const research = appSettingsSchema.parse({ defaultPreset: 'research' })
    // research 프리셋 → researchMode deep, facts 게이트 on
    const cfg = buildConfig(research, { prompt: 'X' })
    expect(cfg.researchMode).toBe('deep')
    expect(cfg.gates.facts).toBe(true)
  })

  it('researchMode는 프리셋이 소유 — 앱 기본값이 덮어쓰지 않는다', () => {
    // quick 프리셋은 researchMode=off. 앱 설정엔 researchMode 필드 자체가 없음
    const cfg = buildConfig(app, { prompt: 'X', preset: 'quick' })
    expect(cfg.researchMode).toBe('off')
  })

  it('요청 preset이 앱 defaultPreset을 이긴다', () => {
    const research = appSettingsSchema.parse({ defaultPreset: 'research' })
    const cfg = buildConfig(research, { prompt: 'X', preset: 'quick' })
    expect(cfg.researchMode).toBe('off') // quick 프리셋 반영
  })
})

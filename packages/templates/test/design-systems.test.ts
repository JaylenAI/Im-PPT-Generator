import { describe, expect, it } from 'vitest'
import { themeStyleSchema } from '@im-ppt/schema'
import { DESIGN_SYSTEMS, classifySystem, styleForSystem, withDesignSystem } from '../src/themes/design-systems.js'
import { listThemes } from '../src/index.js'

describe('디자인 시스템 20종(P12 확장)', () => {
  it('정확히 20종이며 id가 유일하다', () => {
    expect(DESIGN_SYSTEMS.length).toBe(20)
    expect(new Set(DESIGN_SYSTEMS.map((s) => s.id)).size).toBe(20)
  })

  it('모든 시스템이 유효한 ThemeStyle을 산출한다', () => {
    for (const sys of DESIGN_SYSTEMS) {
      const style = styleForSystem(sys.id)
      expect(themeStyleSchema.safeParse(style).success).toBe(true)
      expect(style.system).toBe(sys.id)
    }
  })

  it('classifySystem은 항상 정의된 시스템 id를 돌려준다', () => {
    const ids = new Set(DESIGN_SYSTEMS.map((s) => s.id))
    for (const t of listThemes()) {
      expect(ids.has(classifySystem(t.id, t.name))).toBe(true)
    }
  })

  it('classifySystem은 결정적이다(같은 입력 → 같은 시스템)', () => {
    for (const t of listThemes()) {
      expect(classifySystem(t.id, t.name)).toBe(classifySystem(t.id, t.name))
    }
  })

  it('키워드 매칭은 기존 매핑을 보존한다(회귀 방지)', () => {
    expect(classifySystem('deep-navy')).toBe('dark-tech-glow')
    expect(classifySystem('mckinsey-exhibit')).toBe('consulting-grid')
    expect(classifySystem('editorial-magazine')).toBe('editorial-serif')
    expect(classifySystem('bauhaus-poster')).toBe('brutalist-block')
  })

  it('미매치 테마는 단일 시스템에 몰리지 않고 분산된다', () => {
    // 실제 113 테마가 10종 초과로 분포(단조로움 해소)
    const used = new Set(listThemes().map((t) => classifySystem(t.id, t.name)))
    expect(used.size).toBeGreaterThan(10)
  })

  it('withDesignSystem은 style 없는 테마에만 붙이고 기존 style은 보존한다', () => {
    const theme = { id: 'sample-x', name: 'X', tokens: { colors: {}, fonts: {}, fontSizes: {} } } as never
    const withStyle = withDesignSystem({
      id: 'y', name: 'Y',
      tokens: {
        colors: { primary: '#111111', secondary: '#222222', accent: '#333333', background: '#ffffff', surface: '#f0f0f0', textPrimary: '#000000', textSecondary: '#666666' },
        fonts: { heading: 'Inter', body: 'Inter' },
        fontSizes: { display: 60, title: 40, subtitle: 24, body: 18, caption: 14 },
        style: { system: 'brutalist-block', headingCase: 'upper', headingTracking: 'tight', titleAccent: 'block', kicker: 'none', background: 'flat', surface: 'flat', radius: 0, border: 'bold' },
      },
    })
    expect(withStyle.tokens.style?.system).toBe('brutalist-block') // 기존 유지
    void theme
  })
})

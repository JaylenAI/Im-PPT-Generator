import { describe, expect, it } from 'vitest'
import { themeSchema } from '@im-ppt/schema'
import { getTheme, listThemes, TEMPLATES } from '../src/index.js'

describe('테마/템플릿 레지스트리', () => {
  it('테마 16종 이상이 themeSchema를 통과한다(갤러리 확장)', () => {
    const themes = listThemes()
    expect(themes.length).toBeGreaterThanOrEqual(16)
    for (const t of themes) {
      expect(themeSchema.safeParse(t).success).toBe(true)
    }
  })

  it('갤러리 템플릿 6종 이상 노출(모든 themeId 유효)', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(6)
    const themeIds = new Set(listThemes().map((t) => t.id))
    for (const tpl of TEMPLATES) expect(themeIds.has(tpl.themeId)).toBe(true)
  })

  it('미등록 테마는 에러', () => {
    expect(() => getTheme('neon-pink')).toThrow(/등록되지 않은 themeId/)
  })

  it('템플릿 메타의 themeId/레이아웃 참조가 전부 유효하다 (끊긴 참조 금지)', () => {
    for (const template of TEMPLATES) {
      expect(() => getTheme(template.themeId)).not.toThrow()
      expect(template.layoutTypes.length).toBeGreaterThanOrEqual(8)
    }
  })
})

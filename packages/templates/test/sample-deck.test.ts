import { describe, it, expect } from 'vitest'
import { deckSchema } from '@im-ppt/schema'
import { TEMPLATES, buildSampleDeck, getTheme } from '../src/index.js'

describe('buildSampleDeck (템플릿 미리보기)', () => {
  it('모든 템플릿의 샘플 덱이 유효한 Deck을 생성한다', () => {
    for (const t of TEMPLATES) {
      const deck = buildSampleDeck(t.id)
      const parsed = deckSchema.safeParse(deck)
      expect(parsed.success, `${t.id}: ${JSON.stringify(parsed.error?.issues?.[0])}`).toBe(true)
      expect(deck.slides.length).toBe(5)
      expect(deck.themeId).toBe(t.themeId)
      // 테마가 실제 등록돼 있어야 렌더 가능
      expect(() => getTheme(t.themeId)).not.toThrow()
    }
  })

  it('16종 이상 템플릿(6 기본 + 10 갤러리)', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(16)
  })
})

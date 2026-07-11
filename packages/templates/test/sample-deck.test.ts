import { describe, it, expect } from 'vitest'
import { deckSchema } from '@im-ppt/schema'
import { TEMPLATES, buildSampleDeck, getTheme } from '../src/index.js'

describe('buildSampleDeck (템플릿 미리보기)', () => {
  it('모든 템플릿의 샘플 덱이 유효한 Deck을 생성한다', () => {
    for (const t of TEMPLATES) {
      const deck = buildSampleDeck(t.id)
      const parsed = deckSchema.safeParse(deck)
      expect(parsed.success, `${t.id}: ${JSON.stringify(parsed.error?.issues?.[0])}`).toBe(true)
      // layoutOrder(시그니처 시퀀스)가 있으면 그 흐름대로, 없으면 범용 5슬라이드 폴백.
      // 모든 시퀀스 키에 샘플 콘텐츠가 있어야 하므로 길이가 정확히 일치해야 한다(누락 키 감지 게이트).
      const expectedLen = t.layoutOrder && t.layoutOrder.length > 0 ? t.layoutOrder.length : 5
      expect(deck.slides.length, `${t.id} 슬라이드 수(시퀀스 커버리지)`).toBe(expectedLen)
      expect(deck.themeId).toBe(t.themeId)
      // 테마가 실제 등록돼 있어야 렌더 가능
      expect(() => getTheme(t.themeId)).not.toThrow()
    }
  })

  it('16종 이상 템플릿(6 기본 + 10 갤러리)', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(16)
  })
})

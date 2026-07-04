import { describe, expect, it } from 'vitest'
import type { Deck, Slide, SlideElement } from '@im-ppt/schema'
import { deckSchema } from '@im-ppt/schema'
import { getLayout, getTheme } from '@im-ppt/templates'
import { exportDeckToPptx } from '../src/index.js'

/** 8개 레이아웃을 실제 콘텐츠로 build → 요소 전종류를 포함하는 덱을 조립 */
const FIXTURES: Record<string, unknown> = {
  title: { title: '수출 전략 2026', subtitle: '신흥시장 공략', presenter: '전략기획팀' },
  bullets: { title: '핵심 과제', bullets: ['현지화', '채널 확보', '규제 대응'] },
  stat: { title: '성과', stats: [{ value: '+42%', label: '매출 성장' }, { value: '18개국', label: '진출' }] },
  chart: { title: '분기 매출', chartType: 'bar', data: { labels: ['Q1', 'Q2', 'Q3'], series: [{ name: '매출', values: [10, 24, 31] }] }, insight: 'Q3 급성장' },
  quote: { quote: '가장 좋은 예측은 미래를 만드는 것', attribution: 'Alan Kay' },
  closing: { headline: '감사합니다' },
}

function buildDeck(): Deck {
  const ctx = { canvas: { width: 1280, height: 720 } }
  const slides: Slide[] = Object.entries(FIXTURES).map(([key, content], i) => {
    const { background, elements } = getLayout(key).build(content, ctx)
    return {
      id: `s${i}`,
      layoutType: key,
      elements,
      notes: `${key} 슬라이드 노트`,
      citationIds: [],
      status: 'draft',
      ...(background ? { background } : {}),
    }
  })
  // table/image/icon도 매핑 검증: 마지막 슬라이드에 수동 추가
  const extra: SlideElement[] = [
    { id: 't', type: 'table', frame: { x: 80, y: 200, w: 500, h: 200 }, rotation: 0, opacity: 1, locked: false, header: ['국가', '매출'], rows: [['미국', '120'], ['일본', '80']], citationIds: [] },
    { id: 'ic', type: 'icon', name: 'star', frame: { x: 620, y: 200, w: 48, h: 48 }, rotation: 0, opacity: 1, locked: false },
  ]
  slides.push({ id: 'extra', layoutType: 'bullets', elements: extra, notes: '', citationIds: [], status: 'draft' })

  return {
    id: 'deck_test', title: '수출 전략 2026', language: '한국어', aspectRatio: '16:9',
    themeId: 'stitch-indigo', templateId: 'corporate-indigo',
    slides, sources: [], citations: [], version: 1,
  }
}

describe('exportDeckToPptx', () => {
  it('덱을 유효한 PPTX(zip) Buffer로 내보낸다', async () => {
    const deck = buildDeck()
    expect(deckSchema.safeParse(deck).success).toBe(true)
    const tokens = getTheme(deck.themeId).tokens
    const buf = await exportDeckToPptx(deck, tokens, { includeNotes: true })

    expect(buf.length).toBeGreaterThan(1000)
    // PPTX = zip: 매직 바이트 'PK\x03\x04'
    expect(buf[0]).toBe(0x50) // P
    expect(buf[1]).toBe(0x4b) // K
    expect(buf[2]).toBe(0x03)
    expect(buf[3]).toBe(0x04)
  })

  it('다크 테마도 문제없이 내보낸다', async () => {
    const deck = { ...buildDeck(), themeId: 'deep-navy' }
    const tokens = getTheme('deep-navy').tokens
    const buf = await exportDeckToPptx(deck, tokens)
    expect(buf.length).toBeGreaterThan(1000)
  })
})

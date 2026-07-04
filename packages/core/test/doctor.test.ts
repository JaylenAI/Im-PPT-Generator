import { describe, it, expect } from 'vitest'
import type { Deck, Slide, SlideElement } from '@im-ppt/schema'
import { diagnoseDeck } from '../src/index.js'

let idc = 0
function el(partial: Partial<SlideElement> & { type: SlideElement['type'] }): SlideElement {
  idc += 1
  const base = { id: `e${idc}`, frame: { x: 0, y: 0, w: 100, h: 100 }, rotation: 0, opacity: 1, locked: false }
  return { ...base, ...partial } as SlideElement
}
function slide(layoutType: string, elements: SlideElement[]): Slide {
  idc += 1
  return { id: `s${idc}`, layoutType, elements, notes: '', citationIds: [], status: 'draft' }
}
function deck(slides: Slide[]): Deck {
  return {
    id: 'd1', title: 'T', language: 'ko', aspectRatio: '16:9', themeId: 'stitch-indigo',
    slides, sources: [], citations: [], version: 1,
  }
}
const title = (content: string) => el({ type: 'text', role: 'title', content, style: {} })
const body = (content: string) => el({ type: 'text', role: 'body', content, style: {} })

describe('Deck Doctor 진단', () => {
  it('건강한 덱은 이슈 없음·점수 100', () => {
    const d = deck([
      slide('bullets', [title('핵심 전략은 세 가지다'), el({ type: 'list', items: ['비동기 소통', 'OKR 관리', '주 4일제'], marker: 'dot', style: {} })]),
      slide('closing', [title('감사합니다')]),
    ])
    const r = diagnoseDeck(d)
    expect(r.clean).toBe(true)
    expect(r.score).toBe(100)
  })

  it('글머리 과다(6x6)와 긴 항목을 잡는다', () => {
    const many = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] // 7개
    const d = deck([slide('bullets', [title('t'), el({ type: 'list', items: many, marker: 'dot', style: {} })])])
    const r = diagnoseDeck(d)
    expect(r.issues.some((i) => i.kind === 'bullet-overload')).toBe(true)
    expect(r.score).toBeLessThan(100)
  })

  it('텍스트 벽을 잡는다', () => {
    const wall = '가'.repeat(230)
    const d = deck([slide('bullets', [title('t'), body(wall)])])
    const r = diagnoseDeck(d)
    expect(r.issues.some((i) => i.kind === 'text-wall')).toBe(true)
  })

  it('차트에 강조·인사이트가 없으면 스토리 누락을 잡는다', () => {
    const chart = el({
      type: 'chart', chartType: 'bar',
      data: { labels: ['a', 'b'], series: [{ name: 's', values: [1, 2] }] },
      options: { showLegend: false, showValues: false }, citationIds: [],
    })
    const d = deck([slide('chart', [title('t'), chart])])
    const r = diagnoseDeck(d)
    expect(r.issues.some((i) => i.kind === 'chart-no-story')).toBe(true)
  })

  it('차트에 highlightIndex나 chart-insight가 있으면 통과', () => {
    const chart = el({
      type: 'chart', chartType: 'bar',
      data: { labels: ['a', 'b'], series: [{ name: 's', values: [1, 2] }] },
      options: { showLegend: false, showValues: false, highlightIndex: 1 }, citationIds: [],
    })
    const d = deck([slide('chart', [title('t'), chart])])
    const r = diagnoseDeck(d)
    expect(r.issues.some((i) => i.kind === 'chart-no-story')).toBe(false)
  })

  it('빈 콘텐츠 슬라이드를 잡되 title/closing은 제외', () => {
    const d = deck([
      slide('bullets', [title('제목만 있음')]), // empty content
      slide('title', [title('표지')]), // 제외
    ])
    const r = diagnoseDeck(d)
    const empties = r.issues.filter((i) => i.kind === 'empty')
    expect(empties).toHaveLength(1)
    expect(empties[0]!.slideIndex).toBe(0)
  })
})

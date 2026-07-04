import { describe, expect, it } from 'vitest'
import type { Deck, ThemeTokens } from '@im-ppt/schema'
import { checkAccessibility, contrastRatio } from '../src/index.js'

const tokens: ThemeTokens = {
  colors: {
    primary: '#4f46e5', secondary: '#64748b', accent: '#14b8a6',
    background: '#ffffff', surface: '#f8fafc', textPrimary: '#0f172a', textSecondary: '#475569',
  },
  fonts: { heading: 'Inter', body: 'Inter' },
  fontSizes: { display: 48, title: 32, subtitle: 22, body: 18, caption: 14 },
}

function deckWith(elements: Deck['slides'][number]['elements'], bg?: Deck['slides'][number]['background']): Deck {
  return {
    id: 'd1', title: 'T', language: 'ko', aspectRatio: '16:9', themeId: 'stitch-indigo',
    slides: [{ id: 's1', layoutType: 'bullets', elements, notes: '', citationIds: [], status: 'draft', ...(bg ? { background: bg } : {}) }],
    sources: [], citations: [], version: 1,
  }
}

function textEl(id: string, color?: string): Deck['slides'][number]['elements'][number] {
  return {
    id, type: 'text', role: 'body', content: 'hi', frame: { x: 0, y: 0, w: 100, h: 20 },
    rotation: 0, opacity: 1, locked: false, style: color ? { color } : {},
  }
}

describe('contrastRatio', () => {
  it('흑백 = 21:1, 동색 = 1:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 1)
  })
})

describe('checkAccessibility', () => {
  it('기본 다크 텍스트/화이트 배경 = 이슈 없음, 점수 100', () => {
    const r = checkAccessibility(deckWith([textEl('e1')]), tokens) // textPrimary(#0f172a) on background(#fff)
    expect(r.issues).toHaveLength(0)
    expect(r.score).toBe(100)
    expect(r.checked).toBe(1)
  })

  it('저대비(옅은 회색 텍스트 on 화이트) = contrast 에러', () => {
    const r = checkAccessibility(deckWith([textEl('e1', '#dddddd')]), tokens)
    expect(r.issues).toHaveLength(1)
    expect(r.issues[0]).toMatchObject({ kind: 'contrast', severity: 'error', elementId: 'e1' })
    expect(r.score).toBeLessThan(100)
  })

  it('이미지 alt 없음 = 경고', () => {
    const img: Deck['slides'][number]['elements'][number] = {
      id: 'img1', type: 'image', src: 'x.png', fit: 'cover', alt: '',
      frame: { x: 0, y: 0, w: 100, h: 100 }, rotation: 0, opacity: 1, locked: false,
    }
    const r = checkAccessibility(deckWith([img]), tokens)
    expect(r.issues).toHaveLength(1)
    expect(r.issues[0]).toMatchObject({ kind: 'alt-text', severity: 'warning' })
  })

  it('이미지 배경은 대비 검사 스킵(오탐 방지)', () => {
    const r = checkAccessibility(
      deckWith([textEl('e1', '#dddddd')], { kind: 'image', src: 'bg.jpg', overlayOpacity: 0 }),
      tokens,
    )
    // 이미지 배경이라 대비 계산 스킵 → 이슈 없음
    expect(r.issues.filter((i) => i.kind === 'contrast')).toHaveLength(0)
  })
})

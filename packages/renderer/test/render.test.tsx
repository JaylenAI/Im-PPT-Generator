import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Slide, ChartElement } from '@im-ppt/schema'
import { getLayout, getTheme } from '@im-ppt/templates'
import { SlideView } from '../src/index.js'

const theme = getTheme('stitch-indigo')

function slideFrom(layoutKey: string, content: unknown): Slide {
  const { background, elements } = getLayout(layoutKey).build(content, {
    canvas: { width: 1280, height: 720 },
  })
  return {
    id: 's1',
    layoutType: layoutKey,
    elements,
    notes: '',
    citationIds: [],
    status: 'draft',
    ...(background ? { background } : {}),
  }
}

describe('SlideView (SSR 렌더)', () => {
  it('title 슬라이드의 텍스트와 토큰 색상을 렌더', () => {
    const slide = slideFrom('title', { title: 'AI 전략', subtitle: '2026' })
    const html = renderToStaticMarkup(<SlideView slide={slide} theme={theme} />)
    expect(html).toContain('AI 전략')
    expect(html).toContain('2026')
    // 캔버스 고정 크기
    expect(html).toContain('width:1280px')
    expect(html).toContain('height:720px')
    // token:colors.textPrimary → 테마 hex로 해석됨(토큰 문자열이 남지 않음)
    expect(html).not.toContain('token:colors')
    expect(html.toLowerCase()).toContain(theme.tokens.colors.textPrimary.toLowerCase())
  })

  it('bullets 슬라이드가 목록 항목을 렌더', () => {
    const slide = slideFrom('bullets', { title: '요약', bullets: ['첫째', '둘째', '셋째'] })
    const html = renderToStaticMarkup(<SlideView slide={slide} theme={theme} />)
    expect(html).toContain('<ul')
    expect(html).toContain('첫째')
    expect(html).toContain('셋째')
  })

  it('chart 슬라이드가 SVG를 렌더(의존성 없는 인라인 차트)', () => {
    const slide = slideFrom('chart', {
      title: '매출',
      chartType: 'bar',
      data: { labels: ['Q1', 'Q2'], series: [{ name: '매출', values: [10, 20] }] },
    })
    const html = renderToStaticMarkup(<SlideView slide={slide} theme={theme} />)
    expect(html).toContain('<svg')
    expect(html).toContain('<rect')
  })

  it('stat 슬라이드가 카드/값을 렌더', () => {
    const slide = slideFrom('stat', {
      title: '지표',
      stats: [{ value: '87%', label: '정확도' }],
    })
    const html = renderToStaticMarkup(<SlideView slide={slide} theme={theme} />)
    expect(html).toContain('87%')
    expect(html).toContain('정확도')
  })

  it('다크 테마도 배경 토큰을 해석', () => {
    const slide = slideFrom('title', { title: 'T' })
    const html = renderToStaticMarkup(<SlideView slide={slide} theme={getTheme('deep-navy')} />)
    expect(html).not.toContain('token:colors')
  })

  it('데이터 스토리텔링(ADR-011): 강조 데이터 포인트는 accent 색, 나머지는 흐리게', () => {
    const chartEl: ChartElement = {
      id: 'c1',
      type: 'chart',
      chartType: 'bar',
      frame: { x: 100, y: 100, w: 400, h: 300 },
      rotation: 0,
      opacity: 1,
      locked: false,
      data: { labels: ['Q1', 'Q2', 'Q3'], series: [{ name: '매출', values: [10, 20, 55] }] },
      options: { showLegend: false, showValues: false, highlightIndex: 2 },
      citationIds: [],
    }
    const slide: Slide = {
      id: 's1', layoutType: 'chart', elements: [chartEl], notes: '', citationIds: [], status: 'draft',
    }
    const html = renderToStaticMarkup(<SlideView slide={slide} theme={theme} />)
    // 강조 색(accent)이 강조 막대에 사용됨
    expect(html.toLowerCase()).toContain(theme.tokens.colors.accent.toLowerCase())
    // 비강조 막대는 흐리게(opacity 0.35)
    expect(html).toContain('0.35')
  })

  it('데이터 스토리텔링: 차트 레이아웃이 highlightIndex를 element로 전달', () => {
    const slide = slideFrom('chart', {
      title: '전기차 판매',
      chartType: 'bar',
      data: { labels: ['2022', '2023', '2024'], series: [{ name: '판매량', values: [30, 55, 120] }] },
      insight: '2024년 판매가 급증했다',
      highlightIndex: 2,
    })
    const chart = slide.elements.find((e) => e.type === 'chart') as ChartElement
    expect(chart.options.highlightIndex).toBe(2)
    const html = renderToStaticMarkup(<SlideView slide={slide} theme={theme} />)
    // 레이아웃 insight 사이드카드(텍스트 요소)
    expect(html).toContain('2024년 판매가 급증했다')
    // accent 강조
    expect(html.toLowerCase()).toContain(theme.tokens.colors.accent.toLowerCase())
  })
})

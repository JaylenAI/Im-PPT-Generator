import { describe, expect, it } from 'vitest'
import { CANVAS_SIZES, slideElementSchema } from '@im-ppt/schema'
import { getLayout, listLayouts, layoutCatalogForLlm } from '../src/index.js'

const ctx = { canvas: CANVAS_SIZES['16:9'] }

/** 레이아웃별 유효 콘텐츠 fixture — 새 레이아웃 추가 시 여기에 반드시 추가 */
const FIXTURES: Record<string, unknown> = {
  title: { title: 'AI 시장 분석 2026', subtitle: '시장 동향과 대응 전략', presenter: '한승헌', date: '2026-07-03' },
  agenda: { title: '목차', items: ['시장 현황', '경쟁 구도', '전략 제안', '로드맵'] },
  bullets: { title: '핵심 요약', bullets: ['시장 규모 연 34% 성장', '상위 3사 점유율 62%', '규제 리스크 확대'], note: '출처: 시장 보고서' },
  'two-col': {
    title: 'As-Is vs To-Be',
    left: { heading: '현재', bullets: ['수작업 제작', '출처 불명'] },
    right: { heading: '개선 후', bullets: ['AI 자동화', '전 수치 출처 추적'] },
  },
  stat: { title: '성과 지표', stats: [{ value: '87%', label: '검색 정확도' }, { value: '2.3초', label: '평균 응답' }, { value: '42명', label: 'DAU' }] },
  quote: { quote: '가장 좋은 미래 예측 방법은 미래를 직접 만드는 것이다', attribution: 'Alan Kay' },
  chart: {
    title: '분기별 매출',
    chartType: 'bar',
    data: { labels: ['Q1', 'Q2', 'Q3'], series: [{ name: '매출', values: [10, 24, 31] }] },
    insight: 'Q3 급성장은 신규 채널 효과',
  },
  closing: { headline: '감사합니다', message: '질문을 환영합니다' },
  references: { title: '출처', items: ['시장 보고서 2026 — https://example.com/report', '내부 분석 메모'] },
  process: {
    title: '도입 4단계',
    steps: [
      { label: '진단', detail: '현황 파악' },
      { label: '설계', detail: '로드맵 수립' },
      { label: '실행', detail: '단계적 배포' },
      { label: '정착', detail: '성과 측정' },
    ],
  },
}

describe('레이아웃 레지스트리', () => {
  it('레이아웃 10종이 등록되어 있다(references는 hidden)', () => {
    expect(listLayouts().map((l) => l.key).sort()).toEqual(
      ['agenda', 'bullets', 'chart', 'closing', 'process', 'quote', 'references', 'stat', 'title', 'two-col'],
    )
  })

  it('hidden 레이아웃(references)은 LLM 카탈로그에서 제외', () => {
    expect(layoutCatalogForLlm().map((l) => l.key)).not.toContain('references')
    expect(listLayouts().some((l) => l.key === 'references')).toBe(true)
  })

  it('미등록 layoutType은 사용 가능 목록과 함께 에러', () => {
    expect(() => getLayout('hero-banner')).toThrow(/등록되지 않은 layoutType/)
  })

  it('LLM 카탈로그는 key+description을 제공한다', () => {
    for (const item of layoutCatalogForLlm()) {
      expect(item.key.length).toBeGreaterThan(0)
      expect(item.description.length).toBeGreaterThan(10)
    }
  })
})

describe('레이아웃 build — 전 레이아웃 공통 계약', () => {
  for (const layout of listLayouts()) {
    describe(layout.key, () => {
      it('fixture가 존재한다 (새 레이아웃은 테스트 fixture 필수)', () => {
        expect(FIXTURES[layout.key]).toBeDefined()
      })

      it('스키마를 통과하는 요소를 생성한다', () => {
        const { elements } = layout.build(FIXTURES[layout.key], ctx)
        expect(elements.length).toBeGreaterThan(0)
        for (const el of elements) {
          const parsed = slideElementSchema.safeParse(el)
          expect(parsed.success, `${layout.key}/${el.id}: ${JSON.stringify(parsed.success ? '' : parsed.error.issues)}`).toBe(true)
        }
      })

      it('모든 요소가 캔버스 안에 있다 (오버플로 금지)', () => {
        const { elements } = layout.build(FIXTURES[layout.key], ctx)
        for (const el of elements) {
          expect(el.frame.x, `${el.id} x`).toBeGreaterThanOrEqual(0)
          expect(el.frame.y, `${el.id} y`).toBeGreaterThanOrEqual(0)
          expect(el.frame.x + el.frame.w, `${el.id} 우측`).toBeLessThanOrEqual(ctx.canvas.width)
          expect(el.frame.y + el.frame.h, `${el.id} 하단`).toBeLessThanOrEqual(ctx.canvas.height)
        }
      })

      it('요소 id가 슬라이드 내에서 유일하다', () => {
        const { elements } = layout.build(FIXTURES[layout.key], ctx)
        const ids = elements.map((e) => e.id)
        expect(new Set(ids).size).toBe(ids.length)
      })

      it('검증 안 된 콘텐츠는 build에 도달하지 못한다', () => {
        expect(() => layout.build({ 뭔가: '잘못된' }, ctx)).toThrow()
      })
    })
  }
})

describe('개별 레이아웃 동작', () => {
  it('stat: 카드 수만큼 값/라벨을 생성하고 겹치지 않는다', () => {
    const { elements } = getLayout('stat').build(FIXTURES['stat'], ctx)
    const cards = elements.filter((e) => e.id.startsWith('stat-card-'))
    expect(cards).toHaveLength(3)
    const [a, b] = cards
    if (a && b) expect(a.frame.x + a.frame.w).toBeLessThanOrEqual(b.frame.x)
  })

  it('chart: insight 없으면 차트가 전폭을 쓴다', () => {
    const { elements } = getLayout('chart').build(
      { title: 'T', chartType: 'line', data: { labels: ['a'], series: [{ name: 's', values: [1] }] } },
      ctx,
    )
    const chart = elements.find((e) => e.type === 'chart')
    expect(chart?.frame.w).toBe(1120)
  })

  it('title: 스키마 한도(80자) 초과 제목은 build 전에 거부된다', () => {
    expect(() => getLayout('title').build({ title: '가'.repeat(81) }, ctx)).toThrow()
  })
})

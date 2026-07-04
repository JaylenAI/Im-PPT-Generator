import type { Deck, Slide } from '@im-ppt/schema'
import { CANVAS_SIZES } from '@im-ppt/schema'
import { TEMPLATES, getTheme, getLayout } from './registry.js'

/**
 * 템플릿 미리보기용 샘플 덱 — LLM 없이 결정론적 플레이스홀더로 그 템플릿의 디자인을 보여준다.
 * 갤러리 썸네일/미리보기 모달이 이 덱을 우리 렌더러로 그대로 렌더(Canva식 실제 미리보기).
 */
export function buildSampleDeck(templateId: string): Deck {
  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0]!
  const canvas = CANVAS_SIZES['16:9']

  const mk = (layoutKey: string, content: unknown): Slide => {
    const { background, elements } = getLayout(layoutKey).build(content, { canvas })
    return {
      id: `sample_${template.id}_${layoutKey}`,
      layoutType: layoutKey,
      elements,
      notes: '',
      citationIds: [],
      status: 'draft',
      ...(background ? { background } : {}),
    }
  }

  const slides: Slide[] = [
    mk('title', { title: template.name, subtitle: '샘플 미리보기 — 이 템플릿의 디자인' }),
    mk('kpi-grid', {
      title: '주요 성과 지표',
      kpis: [
        { value: '92%', label: '고객 만족도', delta: '+8%p' },
        { value: '3.4배', label: '전년 대비 성장' },
        { value: '#1', label: '시장 점유율' },
      ],
    }),
    mk('cards', {
      title: '핵심 강점',
      cards: [
        { heading: '빠른 생성', body: '주제만 입력하면 AI가 완성된 덱을 만듭니다' },
        { heading: '근거 기반', body: '모든 수치는 출처로 역추적됩니다' },
        { heading: '바로 편집', body: '진짜 편집 가능한 PPTX로 내보냅니다' },
      ],
    }),
    mk('chart', {
      title: '분기별 성장 추이',
      chartType: 'bar',
      data: { labels: ['Q1', 'Q2', 'Q3', 'Q4'], series: [{ name: '매출', values: [40, 58, 72, 110] }] },
      insight: '4분기 들어 성장이 가속됐다',
      highlightIndex: 3,
    }),
    mk('closing', { headline: '함께 시작하세요', message: template.name }),
  ]

  return {
    id: `sample_${template.id}`,
    title: template.name,
    language: 'ko',
    aspectRatio: '16:9',
    themeId: template.themeId,
    templateId: template.id,
    slides,
    sources: [],
    citations: [],
    version: 1,
  }
}

import type { Citation, Deck, Fact, GenerationConfig, GenerationEvent, Outline, Slide, Source } from '@im-ppt/schema'
import { CANVAS_SIZES, getPresentationType } from '@im-ppt/schema'
import { TEMPLATES, getLayout, getTheme, hasTheme } from '@im-ppt/templates'
import { buildCitations } from '@im-ppt/research'
import { generateOutline } from './outline.js'
import { generateSlide, type SlideDeps } from './slide.js'

/** 출처 슬라이드 — 인용된 소스를 번호 리스트로. 렌더러/익스포터가 자동 렌더(둘 다 덱 소비) */
function buildSourcesSlide(
  citations: Citation[],
  sources: Source[],
  config: GenerationConfig,
): Slide {
  const sourceById = new Map(sources.map((s) => [s.id, s]))
  const items = citations.map((c) => {
    const src = sourceById.get(c.sourceId)
    const title = src?.title ?? '출처'
    return src?.url ? `${title} — ${src.url}` : title
  })
  const layout = getLayout('references')
  const title = config.language.toLowerCase().startsWith('ko') ? '출처' : 'Sources'
  const { background, elements } = layout.build(
    { title, items },
    { canvas: CANVAS_SIZES[config.aspectRatio] },
  )
  return {
    id: `sources_${Math.random().toString(36).slice(2, 9)}`,
    layoutType: 'references',
    elements,
    notes: '',
    citationIds: citations.map((c) => c.id),
    status: 'draft',
    ...(background ? { background } : {}),
  }
}

/** 리서치 결과(사전 계산) — api 워커가 runResearch로 만들어 주입 */
export interface ResearchInput {
  sources: Source[]
  facts: Fact[]
}

/** 충돌 안전 덱 ID — 서버 재시작에도 카운터 리셋으로 인한 PK 충돌 없음 */
function nextDeckId(): string {
  return `deck_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

/**
 * config.templateId → 템플릿, 미지정 시 기본. 테마도 함께 resolve.
 * 테마 우선순위: 명시 themeId > (사용자가 템플릿 선택시 그 테마) > 발표 유형 기본 테마 > 템플릿 기본.
 * 발표 유형(ADR-010/P0.6)이 장르에 맞는 시각 정체성을 자동 부여 — 단, 사용자의 명시 선택은 언제나 우선.
 */
function resolveTemplate(config: GenerationConfig): { templateId: string; themeId: string } {
  const explicit = config.templateId ? TEMPLATES.find((t) => t.id === config.templateId) : undefined
  const template = explicit ?? TEMPLATES[0]
  if (!template) throw new Error('사용 가능한 템플릿이 없습니다')
  const typeTheme = getPresentationType(config.presentationType).defaultThemeId
  const themeId =
    config.themeId ??
    (explicit ? template.themeId : hasTheme(typeTheme) ? typeTheme : template.themeId)
  return { templateId: template.id, themeId }
}

function assembleDeck(
  config: GenerationConfig,
  ids: { templateId: string; themeId: string },
  outline: Outline,
  slides: Deck['slides'],
  opts: { deckId?: string; sources?: Source[]; citations?: Citation[] } = {},
): Deck {
  const sources = opts.sources ?? []
  const citations = opts.citations ?? []
  // 인용이 있으면 마지막에 출처 슬라이드 자동 추가(할루시네이션 제로 — 근거 가시화)
  const allSlides = citations.length > 0 ? [...slides, buildSourcesSlide(citations, sources, config)] : slides
  return {
    id: opts.deckId ?? nextDeckId(),
    title: config.prompt.trim().slice(0, 80) || '제목 없는 프레젠테이션',
    language: config.language,
    aspectRatio: config.aspectRatio,
    themeId: ids.themeId,
    templateId: ids.templateId,
    outline: { ...outline, status: 'approved' },
    slides: allSlides,
    sources,
    citations,
    version: 1,
  }
}

/**
 * 덱 전체 생성 — 아웃라인(또는 사전 승인 아웃라인) → 슬라이드 병렬 생성 → 덱 조립.
 * 게이트는 이 함수 밖(잡/API 레이어)에서 삽입한다(core는 생성 프리미티브만 — ADR-007).
 */
export async function generateDeck(
  config: GenerationConfig,
  deps: SlideDeps,
  opts: { outline?: Outline; research?: ResearchInput } = {},
): Promise<{ deck: Deck; costUsd: number }> {
  const ids = resolveTemplate(config)
  getTheme(ids.themeId)

  const research = opts.research ?? { sources: [], facts: [] }
  const { citations, sourceToCitation } = buildCitations(research.sources, research.facts)

  const outline = opts.outline ?? (await generateOutline(config, deps, { facts: research.facts })).outline
  const results = await Promise.all(
    outline.sections.map((section) => {
      const facts = research.facts.filter((f) => section.factIds.includes(f.id))
      return generateSlide({ config, section, deps, facts, sourceToCitation })
    }),
  )
  const slides = results.map((r) => r.slide)
  const costUsd = results.reduce((sum, r) => sum + (r.usage?.costUsd ?? 0), 0)
  return {
    deck: assembleDeck(config, ids, outline, slides, {
      sources: research.sources,
      citations,
    }),
    costUsd,
  }
}

/**
 * 스트리밍 생성 — 의미 단위 이벤트를 onEvent로 방출(ADR-004). "AI가 실시간으로 만드는 모습".
 * 슬라이드는 병렬 생성하되 완료되는 대로 slide_done을 흘려 UI가 하나씩 채운다.
 */
export async function generateDeckStreaming(
  config: GenerationConfig,
  deps: SlideDeps,
  onEvent: (event: GenerationEvent) => void | Promise<void>,
  opts: { deckId?: string; research?: ResearchInput } = {},
): Promise<Deck> {
  const ids = resolveTemplate(config)
  getTheme(ids.themeId)

  const research = opts.research ?? { sources: [], facts: [] }
  const { citations, sourceToCitation } = buildCitations(research.sources, research.facts)
  if (research.facts.length > 0) {
    await onEvent({ type: 'facts_extracted', facts: research.facts })
  }

  const outline = (await generateOutline(config, deps, { facts: research.facts })).outline
  await onEvent({ type: 'outline_ready', outline })

  const slides: Deck['slides'] = new Array(outline.sections.length)
  await Promise.all(
    outline.sections.map(async (section, index) => {
      await onEvent({ type: 'slide_started', slideId: section.id, index })
      const facts = research.facts.filter((f) => section.factIds.includes(f.id))
      const { slide } = await generateSlide({ config, section, deps, facts, sourceToCitation })
      slides[index] = slide
      await onEvent({ type: 'slide_done', slideId: slide.id, slide })
    }),
  )

  const deck = assembleDeck(config, ids, outline, slides, {
    ...(opts.deckId !== undefined ? { deckId: opts.deckId } : {}),
    sources: research.sources,
    citations,
  })
  await onEvent({ type: 'deck_done', deckId: deck.id })
  return deck
}

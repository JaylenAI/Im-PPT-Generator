import type { Deck, GenerationConfig, GenerationEvent, Outline } from '@im-ppt/schema'
import { TEMPLATES, getTheme } from '@im-ppt/templates'
import { generateOutline } from './outline.js'
import { generateSlide, type SlideDeps } from './slide.js'

let deckCounter = 0
function nextDeckId(): string {
  deckCounter += 1
  return `deck_${deckCounter}`
}

/** config.templateId → 템플릿, 미지정 시 기본(corporate-indigo). 테마도 함께 resolve */
function resolveTemplate(config: GenerationConfig): { templateId: string; themeId: string } {
  const explicit = config.templateId ? TEMPLATES.find((t) => t.id === config.templateId) : undefined
  const template = explicit ?? TEMPLATES[0]
  if (!template) throw new Error('사용 가능한 템플릿이 없습니다')
  return { templateId: template.id, themeId: config.themeId ?? template.themeId }
}

function assembleDeck(
  config: GenerationConfig,
  ids: { templateId: string; themeId: string },
  outline: Outline,
  slides: Deck['slides'],
): Deck {
  return {
    id: nextDeckId(),
    title: config.prompt.trim().slice(0, 80) || '제목 없는 프레젠테이션',
    language: config.language,
    aspectRatio: config.aspectRatio,
    themeId: ids.themeId,
    templateId: ids.templateId,
    outline: { ...outline, status: 'approved' },
    slides,
    sources: [],
    citations: [],
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
  opts: { outline?: Outline } = {},
): Promise<{ deck: Deck; costUsd: number }> {
  const ids = resolveTemplate(config)
  getTheme(ids.themeId)

  const outline = opts.outline ?? (await generateOutline(config, deps)).outline
  const results = await Promise.all(
    outline.sections.map((section) => generateSlide({ config, section, deps })),
  )
  const slides = results.map((r) => r.slide)
  const costUsd = results.reduce((sum, r) => sum + (r.usage?.costUsd ?? 0), 0)
  return { deck: assembleDeck(config, ids, outline, slides), costUsd }
}

/**
 * 스트리밍 생성 — 의미 단위 이벤트를 onEvent로 방출(ADR-004). "AI가 실시간으로 만드는 모습".
 * 슬라이드는 병렬 생성하되 완료되는 대로 slide_done을 흘려 UI가 하나씩 채운다.
 */
export async function generateDeckStreaming(
  config: GenerationConfig,
  deps: SlideDeps,
  onEvent: (event: GenerationEvent) => void | Promise<void>,
): Promise<Deck> {
  const ids = resolveTemplate(config)
  getTheme(ids.themeId)

  const outline = (await generateOutline(config, deps)).outline
  await onEvent({ type: 'outline_ready', outline })

  const slides: Deck['slides'] = new Array(outline.sections.length)
  await Promise.all(
    outline.sections.map(async (section, index) => {
      await onEvent({ type: 'slide_started', slideId: section.id, index })
      const { slide } = await generateSlide({ config, section, deps })
      slides[index] = slide
      await onEvent({ type: 'slide_done', slideId: slide.id, slide })
    }),
  )

  const deck = assembleDeck(config, ids, outline, slides)
  await onEvent({ type: 'deck_done', deckId: deck.id })
  return deck
}

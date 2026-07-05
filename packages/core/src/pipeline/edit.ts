import type { Deck, Slide } from '@im-ppt/schema'
import { CANVAS_SIZES } from '@im-ppt/schema'
import { getLayout, getTheme, hasTheme } from '@im-ppt/templates'
import type { SlideDeps } from './slide.js'

/** 슬라이드의 현재 텍스트 콘텐츠를 요약해 편집 컨텍스트로 제공 */
function currentContentText(slide: Slide): string {
  const parts: string[] = []
  for (const el of slide.elements) {
    if (el.type === 'text') parts.push(el.content)
    else if (el.type === 'list') parts.push(el.items.map((i) => `- ${i}`).join('\n'))
  }
  return parts.join('\n') || '(내용 없음)'
}

/**
 * 페이지 단위 AI 수정 — 선택 슬라이드 하나만 지시에 따라 재생성(레이아웃 유지).
 * 레이아웃 contentSchema를 출력 계약으로 사용해 다른 페이지는 건드리지 않는다(NotebookLM식).
 */
export async function editSlide(params: {
  deck: Deck
  slideId: string
  instruction: string
  deps: SlideDeps
}): Promise<{ slide: Slide; usage?: { costUsd?: number } }> {
  const { deck, slideId, instruction, deps } = params
  const slide = deck.slides.find((s) => s.id === slideId)
  if (!slide) throw new Error(`슬라이드를 찾을 수 없습니다: ${slideId}`)

  const layout = getLayout(slide.layoutType)
  const canvas = CANVAS_SIZES[deck.aspectRatio]
  const style = hasTheme(deck.themeId) ? getTheme(deck.themeId).tokens.style : undefined

  const prompt = deps.prompts.get('edit_system', {
    instruction,
    layoutType: layout.key,
    currentContent: currentContentText(slide),
    language: deck.language,
  })

  const { data, usage } = await deps.registry.generateStructured('edit', prompt, layout.contentSchema)
  const { background, elements } = layout.build(data, { canvas, style })

  return {
    slide: {
      ...slide,
      elements,
      status: 'draft',
      ...(background ? { background } : {}),
    },
    ...(usage?.costUsd !== undefined ? { usage: { costUsd: usage.costUsd } } : {}),
  }
}

/** 덱에서 한 슬라이드를 교체한 새 덱 반환(불변) */
export function replaceSlide(deck: Deck, slide: Slide): Deck {
  return {
    ...deck,
    slides: deck.slides.map((s) => (s.id === slide.id ? slide : s)),
    version: deck.version + 1,
  }
}

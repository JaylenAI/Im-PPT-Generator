import type { Deck, Slide } from '@im-ppt/schema'
import { resolveGenerationConfig } from '@im-ppt/schema'
import { generateSlide, type SlideDeps } from './slide.js'

/** 콘텐츠 표현이 유연한 레이아웃(변형 후보) — title/closing/chart 등 특수형 제외 */
const CONTENT_LAYOUTS = ['bullets', 'two-col', 'stat', 'quote', 'agenda', 'process']

/** 슬라이드의 대표 제목(첫 title/display 텍스트) */
function slideTitle(slide: Slide, fallback: string): string {
  const t = slide.elements.find((e) => e.type === 'text' && (e.role === 'title' || e.role === 'display'))
  return t && t.type === 'text' ? t.content : fallback
}

/** 슬라이드 콘텐츠 요약(제목 외 텍스트/리스트를 한 줄로) */
function slideSummary(slide: Slide): string {
  const parts: string[] = []
  for (const el of slide.elements) {
    if (el.type === 'text' && el.role !== 'title' && el.role !== 'display') parts.push(el.content)
    else if (el.type === 'list') parts.push(...el.items)
  }
  return parts.join(' · ').slice(0, 200)
}

/** 현재 레이아웃과 다른 콘텐츠 레이아웃 n개 선택 */
function altLayouts(current: string, n: number): string[] {
  return CONTENT_LAYOUTS.filter((l) => l !== current).slice(0, n)
}

/**
 * 슬라이드 디자인 변형 생성(P8) — 같은 내용을 여러 레이아웃으로 재생성해 선택지 제공.
 * 슬라이드에서 제목/요약을 뽑아 유사 섹션을 만들고, 다른 레이아웃 n개로 병렬 생성.
 */
export async function generateVariants(
  deck: Deck,
  slideId: string,
  deps: SlideDeps,
  opts: { count?: number } = {},
): Promise<{ variants: Slide[]; costUsd: number }> {
  const slide = deck.slides.find((s) => s.id === slideId)
  if (!slide) throw new Error('슬라이드를 찾을 수 없습니다')

  const config = resolveGenerationConfig({
    prompt: deck.title,
    language: deck.language,
    aspectRatio: deck.aspectRatio,
  })
  const title = slideTitle(slide, deck.title)
  const summary = slideSummary(slide)
  const layouts = altLayouts(slide.layoutType, opts.count ?? 3)

  const results = await Promise.all(
    layouts.map((layoutHint) =>
      generateSlide({
        config,
        section: { id: `${slideId}_var`, title, summary, layoutHint, factIds: [] },
        deps,
      }),
    ),
  )
  return {
    variants: results.map((r) => r.slide),
    costUsd: results.reduce((sum, r) => sum + (r.usage?.costUsd ?? 0), 0),
  }
}

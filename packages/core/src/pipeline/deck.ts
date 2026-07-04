import type { Deck, GenerationConfig, Outline } from '@im-ppt/schema'
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

/**
 * 덱 전체 생성 — 아웃라인(또는 사전 승인 아웃라인) → 슬라이드 순차 생성 → 덱 조립.
 * 게이트는 이 함수 밖(잡/API 레이어)에서 삽입한다(core는 생성 프리미티브만 — ADR-007).
 */
export async function generateDeck(
  config: GenerationConfig,
  deps: SlideDeps,
  opts: { outline?: Outline } = {},
): Promise<{ deck: Deck; costUsd: number }> {
  const { templateId, themeId } = resolveTemplate(config)
  getTheme(themeId) // 존재 검증(미등록이면 명확히 실패)

  const outline = opts.outline ?? (await generateOutline(config, deps)).outline
  // 슬라이드는 서로 독립 → 병렬 생성(순서는 Promise.all이 보존). 대량 덱의 동시성 캡은 P2 잡큐에서.
  const results = await Promise.all(
    outline.sections.map((section) => generateSlide({ config, section, deps })),
  )
  const slides = results.map((r) => r.slide)
  const costUsd = results.reduce((sum, r) => sum + (r.usage?.costUsd ?? 0), 0)

  const deck: Deck = {
    id: nextDeckId(),
    title: config.prompt.trim().slice(0, 80) || '제목 없는 프레젠테이션',
    language: config.language,
    aspectRatio: config.aspectRatio,
    themeId,
    templateId,
    outline: { ...outline, status: 'approved' },
    slides,
    sources: [],
    citations: [],
    version: 1,
  }
  return { deck, costUsd }
}

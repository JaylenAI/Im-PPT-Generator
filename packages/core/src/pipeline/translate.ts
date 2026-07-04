import { z } from 'zod'
import type { Deck, Slide } from '@im-ppt/schema'
import type { ProviderRegistry } from '../providers/registry.js'
import type { PromptStore } from '../prompts/loader.js'

const translateDraftSchema = z.object({ translations: z.array(z.string()) })

export interface TranslateDeps {
  registry: ProviderRegistry
  prompts: PromptStore
}

let deckCounter = 0
function newDeckId(): string {
  deckCounter += 1
  return `deck_${Date.now().toString(36)}${deckCounter}tr`
}

/** 슬라이드의 편집 가능한 텍스트를 순서대로 수집(text.content, list.items) */
function collectTexts(slide: Slide): string[] {
  const out: string[] = []
  for (const el of slide.elements) {
    if (el.type === 'text') out.push(el.content)
    else if (el.type === 'list') out.push(...el.items)
  }
  return out
}

/** 번역 결과를 같은 순서로 재적용(레이아웃/좌표 불변, 텍스트만 교체) */
function applyTexts(slide: Slide, translated: string[]): Slide {
  let i = 0
  const elements = slide.elements.map((el) => {
    if (el.type === 'text') return { ...el, content: translated[i++] ?? el.content }
    if (el.type === 'list') return { ...el, items: el.items.map(() => translated[i++] ?? '').filter((s) => s.length > 0) }
    return el
  })
  return { ...slide, elements }
}

/** 슬라이드 1장 번역 — 텍스트 개수 불일치 시 원문 유지(안전) */
async function translateSlide(
  slide: Slide,
  targetLanguage: string,
  deps: TranslateDeps,
): Promise<Slide> {
  const texts = collectTexts(slide)
  if (texts.length === 0) return slide
  const prompt = deps.prompts.get('translate_system', {
    targetLanguage,
    texts: texts.map((t, i) => `${i + 1}. ${t}`).join('\n'),
  })
  const { data } = await deps.registry.generateStructured('edit', prompt, translateDraftSchema)
  if (data.translations.length !== texts.length) return slide // 개수 불일치 → 원문 유지
  return applyTexts(slide, data.translations)
}

/**
 * 덱 전체 번역(P10) — 모든 슬라이드 텍스트를 대상 언어로. 레이아웃/좌표/구조는 불변.
 * 원본을 보존하기 위해 새 덱 ID로 반환(호출측이 저장). 슬라이드는 병렬 번역.
 */
export async function translateDeck(
  deck: Deck,
  targetLanguage: string,
  deps: TranslateDeps,
): Promise<Deck> {
  const slides = await Promise.all(deck.slides.map((s) => translateSlide(s, targetLanguage, deps)))
  return {
    ...deck,
    id: newDeckId(),
    title: deck.title, // 제목은 원본 유지(원하면 후속에서 번역)
    language: targetLanguage,
    slides,
    version: 1,
  }
}

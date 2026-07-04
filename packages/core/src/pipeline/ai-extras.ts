import { z } from 'zod'
import type { Deck, Slide } from '@im-ppt/schema'
import type { ProviderRegistry } from '../providers/registry.js'
import type { PromptStore } from '../prompts/loader.js'

export interface ExtrasDeps {
  registry: ProviderRegistry
  prompts: PromptStore
}

const notesSchema = z.object({ notes: z.string() })
const questionsSchema = z.object({ questions: z.array(z.string()).min(1) })

function slideTextContent(slide: Slide): string {
  const parts: string[] = []
  for (const el of slide.elements) {
    if (el.type === 'text') parts.push(el.content)
    else if (el.type === 'list') parts.push(...el.items)
  }
  return parts.join(' · ')
}

function slideTitle(slide: Slide, fallback: string): string {
  const t = slide.elements.find((e) => e.type === 'text' && (e.role === 'title' || e.role === 'display'))
  return t && t.type === 'text' ? t.content : fallback
}

/** claude CLI가 간헐적으로 노트 대신 넣는 작업 메타-설명 감지 → 그런 노트는 폐기 */
const META_PATTERN =
  /코드 변경|사용자 요청|답변으로 제공|작성해 답변|발표자 노트를 작성|작성하는 (작업|콘텐츠)|이 슬라이드의 (발표자 )?노트/
function looksLikeMeta(text: string): boolean {
  return META_PATTERN.test(text)
}

/**
 * AI 스피커 노트(P9) — 각 슬라이드 내용 기반 발표자 노트를 생성해 slide.notes 채움.
 * 슬라이드 병렬 처리. 원본 구조/요소 불변, notes만 갱신.
 */
export async function generateSpeakerNotes(deck: Deck, deps: ExtrasDeps): Promise<Deck> {
  const slides = await Promise.all(
    deck.slides.map(async (slide) => {
      const prompt = deps.prompts.get('speaker_notes_system', {
        topic: deck.title,
        slideTitle: slideTitle(slide, deck.title),
        slideContent: slideTextContent(slide) || '(내용 없음)',
        language: deck.language,
      })
      try {
        const { data } = await deps.registry.generateStructured('edit', prompt, notesSchema)
        // 메타-설명 누출이면 폐기(원본 유지) — 사용자에게 작업 서술이 보이지 않게
        if (looksLikeMeta(data.notes)) return slide
        return { ...slide, notes: data.notes }
      } catch {
        return slide // 실패 시 원본 노트 유지
      }
    }),
  )
  return { ...deck, slides }
}

/**
 * 예상 청중 질문(P10) — 덱 목차 기반으로 청중이 물어볼 질문 생성.
 */
export async function generateAudienceQuestions(deck: Deck, deps: ExtrasDeps): Promise<string[]> {
  const outline =
    deck.outline?.sections.map((s, i) => `${i + 1}. ${s.title}`).join('\n') ??
    deck.slides.map((s, i) => `${i + 1}. ${s.layoutType}`).join('\n')
  const prompt = deps.prompts.get('audience_questions_system', {
    topic: deck.title,
    outline,
    language: deck.language,
  })
  const { data } = await deps.registry.generateStructured('edit', prompt, questionsSchema)
  return data.questions
}

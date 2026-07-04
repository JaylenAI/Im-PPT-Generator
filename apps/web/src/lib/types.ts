// 슬라이드/덱 모델은 우리 스키마(SSOT)를 사용 — flow-deck-creator 의미형 모델 대체
export type { Deck, Slide, Theme, SlideElement, TemplateMeta } from '@im-ppt/schema'

/** UI 전용 타입(에디터 Copilot) */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
  kind?: 'text' | 'suggestions' | 'thinking'
  suggestions?: string[]
}

export const makeId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

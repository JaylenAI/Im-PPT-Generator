import type { Deck, Theme, TemplateMeta } from '@im-ppt/schema'

/** API 클라이언트 — 표준 봉투 {data}/{error} 파싱. 웹은 이 계약만 안다(ADR-007) */
const BASE = '/api/v1'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  })
  const body = (await res.json().catch(() => null)) as
    | { data: T }
    | { error: { code: string; message: string } }
    | null
  if (!res.ok || !body || 'error' in body) {
    const msg = body && 'error' in body ? body.error.message : `요청 실패 (${res.status})`
    throw new Error(msg)
  }
  return body.data
}

export interface GenerateInput {
  prompt: string
  preset?: 'quick' | 'standard' | 'research' | 'precision' | 'my_materials'
  slideCount?: number
  tone?: string
  language?: string
  templateId?: string
}

/** SSE 생성 이벤트 — 백엔드 events.ts 계약의 프론트 소비 형태 */
export type StreamEvent =
  | { type: 'job_started' }
  | { type: 'outline_ready'; outline: { sections: Array<{ id: string; title: string }> } }
  | { type: 'slide_started'; slideId: string; index: number }
  | { type: 'slide_done'; slideId: string; slide: import('@im-ppt/schema').Slide }
  | { type: 'deck_done'; deckId: string }
  | { type: 'deck_saved'; deckId: string; deck: Deck }
  | { type: 'job_error'; message: string }

/** POST 응답을 text/event-stream으로 읽어 이벤트를 콜백 — "실시간 생성" 소비 */
async function streamDeck(input: GenerateInput, onEvent: (e: StreamEvent) => void): Promise<void> {
  const res = await fetch(`${BASE}/decks/stream`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok || !res.body) throw new Error(`스트림 시작 실패 (${res.status})`)
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    // SSE 프레임은 빈 줄로 구분, 각 프레임의 `data:` 라인을 파싱
    const frames = buf.split('\n\n')
    buf = frames.pop() ?? ''
    for (const frame of frames) {
      const line = frame.split('\n').find((l) => l.startsWith('data:'))
      if (!line) continue
      try {
        onEvent(JSON.parse(line.slice(5).trim()) as StreamEvent)
      } catch {
        /* 부분 프레임 무시 */
      }
    }
  }
}

export const api = {
  generateDeck: (input: GenerateInput) =>
    req<{ deckId: string; deck: Deck; costUsd: number }>('/decks', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  streamDeck,

  getDeck: (id: string) => req<Deck>(`/decks/${id}`),

  regenerateSlide: (deckId: string, slideId: string, instruction: string) =>
    req<{ slide: import('@im-ppt/schema').Slide; deck: Deck; costUsd: number }>(
      `/decks/${deckId}/slides/${slideId}/regenerate`,
      { method: 'POST', body: JSON.stringify({ instruction }) },
    ),

  listThemes: () => req<Theme[]>('/themes'),

  listTemplates: () => req<TemplateMeta[]>('/templates'),

  createExport: (deckId: string) =>
    req<{ exportId: string; filename: string }>(`/decks/${deckId}/export`, {
      method: 'POST',
      body: JSON.stringify({ format: 'pptx' }),
    }),

  downloadUrl: (exportId: string) => `${BASE}/exports/${exportId}/download`,

  // AI 설정
  getModels: () =>
    req<{ connections: ModelConnectionView[]; assignments: Record<string, string> }>(
      '/settings/models',
    ),

  getPrompts: () => req<PromptView[]>('/settings/prompts'),

  patchPrompt: (key: string, content: string) =>
    req<PromptView>(`/settings/prompts/${key}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }),
}

export interface ModelConnectionView {
  id: string
  name: string
  provider: string
  model: string
  tags: string[]
  isActive: boolean
  apiKey?: string
}

export interface PromptView {
  key: string
  description: string
  category: string
  variables: string[]
  defaultContent: string
  currentContent: string
  isOverridden: boolean
}

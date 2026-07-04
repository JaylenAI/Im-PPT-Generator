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
}

export const api = {
  generateDeck: (input: GenerateInput) =>
    req<{ deckId: string; deck: Deck; costUsd: number }>('/decks', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  getDeck: (id: string) => req<Deck>(`/decks/${id}`),

  listThemes: () => req<Theme[]>('/themes'),

  listTemplates: () => req<TemplateMeta[]>('/templates'),

  createExport: (deckId: string) =>
    req<{ exportId: string; filename: string }>(`/decks/${deckId}/export`, {
      method: 'POST',
      body: JSON.stringify({ format: 'pptx' }),
    }),

  downloadUrl: (exportId: string) => `${BASE}/exports/${exportId}/download`,
}

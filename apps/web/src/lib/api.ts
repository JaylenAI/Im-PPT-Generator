import type { Deck, Theme, TemplateMeta, Outline, SlidePlan, Source, Fact, PresentationType, PresentationTypeId } from '@im-ppt/schema'

/** 사용자 제공 자료(리서치 입력) */
export interface UserSource {
  kind: 'user_url' | 'user_text'
  url?: string
  text?: string
  title?: string
}

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
  aspectRatio?: '16:9' | '4:3' | '9:16'
  audience?: string
  sources?: UserSource[]
  presentationType?: PresentationTypeId
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

  // HITL 게이트 — 아웃라인/계획 미리보기(승인 전)
  previewOutline: (input: GenerateInput) =>
    req<{ outline: Outline; sources: Source[]; facts: Fact[] }>('/decks/outline', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  previewPlans: (input: GenerateInput & { outline: Outline; facts?: Fact[] }) =>
    req<{ plans: SlidePlan[]; costUsd: number }>('/decks/plans', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  // 게이트 승인 후 최종 생성 — 승인된 아웃라인 + 이미 계산된 리서치 재사용
  generateApproved: (
    input: GenerateInput & { outline: Outline; research?: { sources: Source[]; facts: Fact[] } },
  ) =>
    req<{ deckId: string; deck: Deck; costUsd: number }>('/decks', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  streamDeck,

  getDeck: (id: string) => req<Deck>(`/decks/${id}`),

  // 수동 편집 저장(WYSIWYG) — 편집한 덱 전체를 저장
  updateDeck: (id: string, deck: Deck) =>
    req<Deck>(`/decks/${id}`, { method: 'PATCH', body: JSON.stringify(deck) }),

  // 덱 복제(P6)
  duplicateDeck: (id: string) =>
    req<{ deckId: string; deck: Deck }>(`/decks/${id}/duplicate`, { method: 'POST' }),

  // Ghost Deck / Titles Test(ADR-009) — 제목만 순서 + 논리 골격 점검
  ghostDeck: (id: string) =>
    req<{ titles: string[]; coherent: boolean; issues: Array<{ index: number; kind: string; detail: string }> }>(
      `/decks/${id}/ghost-deck`,
    ),

  // AI 이미지 생성(P8) — claude -p로 SVG 그래픽 → data URI
  generateImage: (concept: string, themeId?: string) =>
    req<{ dataUri: string; chars: number }>('/images/generate', {
      method: 'POST',
      body: JSON.stringify({ concept, width: 400, height: 300, ...(themeId ? { themeId } : {}) }),
    }),

  regenerateSlide: (deckId: string, slideId: string, instruction: string) =>
    req<{ slide: import('@im-ppt/schema').Slide; deck: Deck; costUsd: number }>(
      `/decks/${deckId}/slides/${slideId}/regenerate`,
      { method: 'POST', body: JSON.stringify({ instruction }) },
    ),

  listThemes: () => req<Theme[]>('/themes'),

  listTemplates: () => req<TemplateMeta[]>('/templates'),

  // 발표 유형 카탈로그(ADR-010) — PT면접/컨설팅/IR/학술/세일즈/일반
  listPresentationTypes: () => req<PresentationType[]>('/presentation-types'),

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

  // 문서 인제스트(P7) — 업로드 파일 → 텍스트 추출(멀티파트)
  extractDocument: async (file: File): Promise<{ filename: string; chars: number; text: string }> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`${BASE}/documents/extract`, { method: 'POST', body: fd })
    const body = (await res.json().catch(() => null)) as
      | { data: { filename: string; chars: number; text: string } }
      | { error: { message: string } }
      | null
    if (!res.ok || !body || 'error' in body) {
      throw new Error(body && 'error' in body ? body.error.message : '문서 추출 실패')
    }
    return body.data
  },

  // 브랜드킷 — 색/폰트 오버라이드(다음 생성부터 반영)
  getBrandKit: () => req<BrandKitView | null>('/settings/brand-kit'),
  patchBrandKit: (kit: BrandKitView) =>
    req<BrandKitView>('/settings/brand-kit', { method: 'PATCH', body: JSON.stringify(kit) }),

  // 브랜드 PPTX 업로드 → 테마 색상 추출 → 브랜드킷 설정
  brandKitFromPptx: async (file: File): Promise<BrandKitView> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`${BASE}/settings/brand-kit/from-pptx`, { method: 'POST', body: fd })
    const body = (await res.json().catch(() => null)) as
      | { data: BrandKitView }
      | { error: { message: string } }
      | null
    if (!res.ok || !body || 'error' in body) {
      throw new Error(body && 'error' in body ? body.error.message : 'PPTX 추출 실패')
    }
    return body.data
  },
}

export interface BrandKitView {
  colors?: { primary?: string; secondary?: string; accent?: string; background?: string; textPrimary?: string }
  fonts?: { heading?: string; body?: string }
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

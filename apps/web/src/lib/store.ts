import { create } from 'zustand'
import type { Deck, Theme } from '@im-ppt/schema'
import { api, type GenerateInput } from './api'

/** 앱 상태 — 덱은 우리 백엔드에서 온 우리 스키마(SSOT). fake 시드/생성 제거 */
interface AppState {
  decks: Deck[]
  themes: Theme[]
  loadThemes: () => Promise<Theme[]>
  themeFor: (deck: Deck) => Theme | undefined
  addDeck: (deck: Deck) => void
  getDeck: (id: string) => Deck | undefined
  generate: (input: GenerateInput) => Promise<Deck>
}

export const useAppStore = create<AppState>((set, get) => ({
  decks: [],
  themes: [],
  loadThemes: async () => {
    if (get().themes.length) return get().themes
    const themes = await api.listThemes()
    set({ themes })
    return themes
  },
  // 브랜드킷 오버라이드가 있으면 덱 자체 테마(인라인 토큰) 사용, 없으면 빌트인
  themeFor: (deck) =>
    deck.themeOverride
      ? { id: `${deck.themeId}-brand`, name: 'Brand', tokens: deck.themeOverride }
      : get().themes.find((t) => t.id === deck.themeId),
  addDeck: (deck) => set((s) => ({ decks: [deck, ...s.decks.filter((d) => d.id !== deck.id)] })),
  getDeck: (id) => get().decks.find((d) => d.id === id),
  generate: async (input) => {
    await get().loadThemes()
    const { deck } = await api.generateDeck(input)
    get().addDeck(deck)
    return deck
  },
}))

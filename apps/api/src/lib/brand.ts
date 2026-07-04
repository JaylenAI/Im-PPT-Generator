import { getTheme } from '@im-ppt/templates'
import { mergeBrandKit, type Deck } from '@im-ppt/schema'
import type { AppDeps } from '../deps.js'

/**
 * 생성된 덱에 브랜드킷 적용(P6) — 설정에 브랜드킷이 있으면 덱 테마 토큰에 병합해
 * deck.themeOverride로 실어 렌더러/익스포터가 브랜드 색/폰트로 그린다.
 */
export function applyBrandKit(deps: AppDeps, deck: Deck): Deck {
  const kit = deps.settings.getBrandKit()
  if (!kit || (!kit.colors && !kit.fonts)) return deck
  try {
    const base = getTheme(deck.themeId).tokens
    return { ...deck, themeOverride: mergeBrandKit(base, kit) }
  } catch {
    return deck // 알 수 없는 테마면 원본 유지
  }
}

/**
 * 브랜딩 적용 — 커스텀 템플릿(PPTX 추출)이 선택되면 그 인라인 테마가 우선(P11.2),
 * 아니면 전역 브랜드킷 적용(P6). 명시 선택이 전역 설정을 이긴다.
 */
export function applyBranding(deps: AppDeps, deck: Deck, templateId?: string): Deck {
  if (templateId) {
    const custom = deps.settings.getCustomTemplate(templateId)
    if (custom) return { ...deck, themeOverride: custom.themeTokens }
  }
  return applyBrandKit(deps, deck)
}

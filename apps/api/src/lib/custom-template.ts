import { mergeBrandKit, type BrandKit, type CustomTemplate } from '@im-ppt/schema'
import { getTheme, listLayouts } from '@im-ppt/templates'

const BASE_THEME = 'stitch-indigo'
const ALL_LAYOUTS = listLayouts().map((l) => l.key)

function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24) || 'template'
  )
}

/**
 * PPTX 추출 브랜드킷(색+폰트) → 커스텀 템플릿(인라인 테마 토큰).
 * 중립 base 테마 위에 추출값을 병합해 완전한 themeTokens를 만들고, 전 레이아웃을 사용하게 한다.
 * builtin과 달리 테마를 코드가 아닌 이 토큰이 소유(deck.themeOverride로 렌더).
 */
export function buildCustomTemplate(name: string, kit: BrandKit, workspaceId: string, id?: string): CustomTemplate {
  const base = getTheme(BASE_THEME).tokens
  const themeTokens = mergeBrandKit(base, kit)
  return {
    id: id ?? `user-${slug(name)}-${Date.now().toString(36).slice(-5)}`,
    name,
    category: 'business',
    themeId: BASE_THEME,
    aspectRatios: ['16:9', '4:3', '9:16'],
    layoutTypes: ALL_LAYOUTS,
    source: 'imported_pptx',
    workspaceId,
    themeTokens,
  }
}

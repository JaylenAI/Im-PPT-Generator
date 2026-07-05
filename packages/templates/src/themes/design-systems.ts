import type { Theme, ThemeStyle } from '@im-ppt/schema'

/**
 * 디자인 시스템(P11) — 색/폰트를 넘어 "골격"을 결정하는 10종.
 * 각 시스템은 decorate 레이어가 읽는 ThemeStyle 파라미터 묶음이다(대문자 헤딩·타이틀 액센트·
 * 배경 장식·표면·헤어라인·radius). 테마는 id/이름 키워드로 시스템에 매핑된다(classifySystem).
 * 목표: 113개 테마가 색만이 아니라 실제 레이아웃 골격까지 시스템 단위로 뚜렷이 달라 보이게.
 */

export interface DesignSystem {
  id: string
  name: string
  style: Omit<ThemeStyle, 'system'>
}

export const DESIGN_SYSTEMS: DesignSystem[] = [
  {
    id: 'dark-tech-glow',
    name: '다크테크 글로우',
    style: { headingCase: 'none', headingTracking: 'tight', titleAccent: 'bar', kicker: 'mono', background: 'grid', surface: 'codeblock', radius: 4, border: 'hairline' },
  },
  {
    id: 'consulting-grid',
    name: '컨설팅 그리드',
    style: { headingCase: 'none', headingTracking: 'normal', titleAccent: 'underline', kicker: 'rule', background: 'flat', surface: 'outline', radius: 0, border: 'hairline' },
  },
  {
    id: 'editorial-serif',
    name: '에디토리얼 세리프',
    style: { headingCase: 'none', headingTracking: 'wide', titleAccent: 'underline', kicker: 'none', background: 'ruled', surface: 'flat', radius: 0, border: 'none' },
  },
  {
    id: 'brutalist-block',
    name: '브루탈리즘 블록',
    style: { headingCase: 'upper', headingTracking: 'tight', titleAccent: 'block', kicker: 'none', background: 'flat', surface: 'flat', radius: 0, border: 'bold' },
  },
  {
    id: 'pastel-card',
    name: '파스텔 카드',
    style: { headingCase: 'none', headingTracking: 'normal', titleAccent: 'bar', kicker: 'none', background: 'flat', surface: 'card', radius: 20, border: 'none' },
  },
  {
    id: 'luxury-keynote',
    name: '럭셔리 키노트',
    style: { headingCase: 'none', headingTracking: 'wide', titleAccent: 'sidebar', kicker: 'none', background: 'watermark', surface: 'flat', radius: 8, border: 'hairline' },
  },
  {
    id: 'swiss-minimal',
    name: '스위스 미니멀',
    style: { headingCase: 'upper', headingTracking: 'tight', titleAccent: 'none', kicker: 'rule', background: 'flat', surface: 'flat', radius: 0, border: 'hairline' },
  },
  {
    id: 'glass-gradient',
    name: '글래스 그라디언트',
    style: { headingCase: 'none', headingTracking: 'normal', titleAccent: 'bar', kicker: 'none', background: 'gradient', surface: 'card', radius: 16, border: 'hairline' },
  },
  {
    id: 'data-infographic',
    name: '데이터 인포그래픽',
    style: { headingCase: 'none', headingTracking: 'normal', titleAccent: 'bar', kicker: 'rule', background: 'flat', surface: 'card', radius: 8, border: 'hairline' },
  },
  {
    id: 'warm-organic',
    name: '웜 오가닉',
    style: { headingCase: 'none', headingTracking: 'normal', titleAccent: 'underline', kicker: 'none', background: 'flat', surface: 'card', radius: 24, border: 'none' },
  },
]

const SYSTEM_BY_ID: ReadonlyMap<string, DesignSystem> = new Map(DESIGN_SYSTEMS.map((s) => [s.id, s]))

/** 키워드 규칙 — 첫 매치 우선. themeId + name(소문자)에 대해 검사 */
const RULES: Array<{ system: string; kw: string[] }> = [
  { system: 'dark-tech-glow', kw: ['dark-tech', 'engineered-dark', 'prismatic', 'blueprint', 'dark-luxury', 'data-dark', 'reveal-black', 'reveal-dracula', 'reveal-moon', 'reveal-league', 'reveal-night', 'reveal-blood', 'midnight', 'deep-navy', 'graphite'] },
  { system: 'consulting-grid', kw: ['consulting', 'bcg', 'bain', 'goldman', 'mckinsey', 'ghost', 'fintech', 'precision', 'strategy', 'samsung', 'hyundai', 'naver', 'korea-policy', 'moef', 'monochrome-infrastructure', 'steel', 'ir-deck', 'exhibit', 'results'] },
  { system: 'editorial-serif', kw: ['editorial', 'magazine', 'luxury-editorial', 'heritage', 'folio', 'archival', 'serif', 'reveal-beige', 'newspaper', 'print-first', 'newsreader'] },
  { system: 'brutalist-block', kw: ['brutal', 'bauhaus', 'swiss', 'memphis', 'bold-block', 'color-block', 'pattern-bold', 'poster', 'confident'] },
  { system: 'pastel-card', kw: ['pastel', 'blush', 'card-news', 'kakao', 'k-culture', 'mcst', 'catppuccin-latte', 'lavender', 'peach', 'soft'] },
  { system: 'luxury-keynote', kw: ['altezza', 'epoch', 'kula-minimalist', 'cinematic-keynote', 'cinematic', 'keynote', 'rose-gold', 'dark-luxury', 'premium'] },
  { system: 'swiss-minimal', kw: ['minimal', 'mono-note', 'mono-ink', 'monochrome-risk', 'reveal-simple', 'reveal-white', 'marp-default', 'marp-uncover', 'kula', 'note'] },
  { system: 'glass-gradient', kw: ['glass', 'vivid-gradient', 'gradient', 'expressive-material', 'night-violet', 'expressive'] },
  { system: 'data-infographic', kw: ['data-infographic', 'infographic', 'isometric', 'skt', 'motie', 'msit', 'catppuccin', 'soundwave', 'platform'] },
  { system: 'warm-organic', kw: ['warm', 'botanical', 'organic', 'amber', 'sage', 'marp-gaia', 'unikorea', 'hospitality', 'sand', 'cloud-dancer'] },
]

/** themeId(+name)로 디자인 시스템 id를 결정. 미매치는 fallback */
export function classifySystem(themeId: string, name = ''): string {
  const hay = `${themeId} ${name}`.toLowerCase()
  for (const r of RULES) {
    if (r.kw.some((k) => hay.includes(k))) return r.system
  }
  return 'swiss-minimal'
}

/** 시스템 id → 완전한 ThemeStyle(system 필드 포함) */
export function styleForSystem(systemId: string): ThemeStyle {
  const sys = SYSTEM_BY_ID.get(systemId) ?? SYSTEM_BY_ID.get('swiss-minimal')!
  return { system: sys.id, ...sys.style }
}

/** 테마에 style이 없으면 분류기로 디자인 시스템을 붙여 반환(불변) */
export function withDesignSystem(theme: Theme): Theme {
  if (theme.tokens.style) return theme
  const systemId = classifySystem(theme.id, theme.name)
  return { ...theme, tokens: { ...theme.tokens, style: styleForSystem(systemId) } }
}

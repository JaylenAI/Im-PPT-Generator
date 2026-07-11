import type { Theme, ThemeStyle } from '@im-ppt/schema'

/**
 * 디자인 시스템(P11→P12) — 색/폰트를 넘어 "골격"을 결정하는 20종.
 * 각 시스템은 decorate 레이어가 읽는 ThemeStyle 파라미터 묶음이다(대문자 헤딩·타이틀 액센트·
 * 배경 장식·표면·헤어라인·radius). 테마는 id/이름 키워드로 시스템에 매핑된다(classifySystem).
 * 목표: 113개 테마가 색만이 아니라 실제 레이아웃 골격까지 시스템 단위로 뚜렷이 달라 보이게.
 * P12에서 10→20으로 확장 — 새 규칙은 기존 규칙 뒤에 붙여 fallback으로 몰리던 테마만 흡수(기존 매핑 불변).
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
  // ── P12 확장: 시스템 10종 추가(골격 조합 다양화) ──
  {
    id: 'terminal-mono',
    name: '터미널 모노',
    style: { headingCase: 'upper', headingTracking: 'tight', titleAccent: 'sidebar', kicker: 'mono', background: 'grid', surface: 'codeblock', radius: 2, border: 'hairline' },
  },
  {
    id: 'poster-bold',
    name: '포스터 볼드',
    style: { headingCase: 'upper', headingTracking: 'wide', titleAccent: 'block', kicker: 'rule', background: 'flat', surface: 'flat', radius: 0, border: 'bold' },
  },
  {
    id: 'cloud-soft',
    name: '클라우드 소프트',
    style: { headingCase: 'none', headingTracking: 'normal', titleAccent: 'bar', kicker: 'none', background: 'gradient', surface: 'card', radius: 28, border: 'none' },
  },
  {
    id: 'corporate-outline',
    name: '코퍼릿 아웃라인',
    style: { headingCase: 'none', headingTracking: 'normal', titleAccent: 'underline', kicker: 'rule', background: 'flat', surface: 'outline', radius: 6, border: 'hairline' },
  },
  {
    id: 'mono-label',
    name: '모노 라벨',
    style: { headingCase: 'none', headingTracking: 'wide', titleAccent: 'sidebar', kicker: 'mono', background: 'flat', surface: 'flat', radius: 0, border: 'hairline' },
  },
  {
    id: 'vivid-block',
    name: '비비드 블록',
    style: { headingCase: 'upper', headingTracking: 'normal', titleAccent: 'block', kicker: 'none', background: 'gradient', surface: 'card', radius: 12, border: 'none' },
  },
  {
    id: 'blueprint-tech',
    name: '블루프린트 테크',
    style: { headingCase: 'none', headingTracking: 'tight', titleAccent: 'sidebar', kicker: 'mono', background: 'grid', surface: 'outline', radius: 0, border: 'hairline' },
  },
  {
    id: 'gallery-frame',
    name: '갤러리 프레임',
    style: { headingCase: 'none', headingTracking: 'wide', titleAccent: 'none', kicker: 'none', background: 'watermark', surface: 'card', radius: 14, border: 'hairline' },
  },
  {
    id: 'neo-startup',
    name: '네오 스타트업',
    style: { headingCase: 'none', headingTracking: 'tight', titleAccent: 'bar', kicker: 'rule', background: 'gradient', surface: 'flat', radius: 10, border: 'none' },
  },
  {
    id: 'paper-academic',
    name: '페이퍼 아카데믹',
    style: { headingCase: 'none', headingTracking: 'normal', titleAccent: 'underline', kicker: 'rule', background: 'ruled', surface: 'outline', radius: 4, border: 'hairline' },
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
  // ── P12 추가 규칙(기존 뒤 — fallback으로 몰리던 테마만 흡수) ──
  { system: 'terminal-mono', kw: ['terminal', 'cli', 'developer', 'hacker', 'matrix', 'console', 'code-dark', 'devtool'] },
  { system: 'poster-bold', kw: ['festival', 'event', 'launch-poster', 'campaign', 'headline-bold', 'billboard', 'anthem'] },
  { system: 'cloud-soft', kw: ['cloud', 'sky', 'breeze', 'serene', 'mint', 'aqua', 'calm', 'dew'] },
  { system: 'corporate-outline', kw: ['corporate', 'enterprise', 'annual', 'boardroom', 'governance', 'quarterly', 'compliance'] },
  { system: 'mono-label', kw: ['label', 'index-mono', 'catalog', 'directory', 'spec-sheet', 'archive-index'] },
  { system: 'vivid-block', kw: ['vivid', 'neon', 'pop-art', 'candy', 'electric', 'saturate', 'rainbow'] },
  { system: 'blueprint-tech', kw: ['engineering', 'architect', 'schematic', 'wireframe', 'system-design', 'blueprint-tech', 'draft-grid'] },
  { system: 'gallery-frame', kw: ['gallery', 'portfolio', 'museum', 'exhibition', 'art-frame', 'lookbook'] },
  { system: 'neo-startup', kw: ['startup', 'saas', 'product-launch', 'growth-deck', 'venture', 'pitch-deck', 'seed-round'] },
  { system: 'paper-academic', kw: ['academic', 'thesis', 'research-paper', 'journal', 'scholar', 'university', 'lecture', 'dissertation'] },
]

/**
 * 키워드 미매치 시 몰아넣지 않고 결정적으로 분산할 중립·범용 시스템 풀.
 * 색을 그대로 읽어 어떤 테마에도 무난한 골격만 포함(공격적 upper/block/bold는 의도적 선택에만).
 */
const FALLBACK_POOL = [
  'swiss-minimal', 'corporate-outline', 'mono-label', 'paper-academic', 'cloud-soft', 'gallery-frame', 'neo-startup',
]

/** 안정 해시(djb2 계열) — 같은 themeId는 항상 같은 fallback 시스템으로 */
function stableHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** themeId(+name)로 디자인 시스템 id를 결정. 미매치는 풀에서 결정적 분산(단조로움 방지) */
export function classifySystem(themeId: string, name = ''): string {
  const hay = `${themeId} ${name}`.toLowerCase()
  for (const r of RULES) {
    if (r.kw.some((k) => hay.includes(k))) return r.system
  }
  return FALLBACK_POOL[stableHash(themeId) % FALLBACK_POOL.length]!
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

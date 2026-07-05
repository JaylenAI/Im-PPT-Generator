import type { Theme, TemplateMeta } from '@im-ppt/schema'
import { defineLayout, type LayoutRuntime } from './layouts/types.js'
import { titleLayout } from './layouts/title.js'
import { agendaLayout } from './layouts/agenda.js'
import { bulletsLayout } from './layouts/bullets.js'
import { twoColLayout } from './layouts/two-col.js'
import { statLayout } from './layouts/stat.js'
import { quoteLayout } from './layouts/quote.js'
import { chartLayout } from './layouts/chart.js'
import { closingLayout } from './layouts/closing.js'
import { processLayout } from './layouts/process.js'
import { referencesLayout } from './layouts/references.js'
import { timelineLayout } from './layouts/timeline.js'
import { comparisonLayout } from './layouts/comparison.js'
import { kpiLayout } from './layouts/kpi.js'
import { cardsLayout } from './layouts/cards.js'
import { bignumLayout } from './layouts/bignum.js'
import { roadmapLayout } from './layouts/roadmap.js'
import { stitchIndigoTheme } from './themes/stitch-indigo.js'
import { deepNavyTheme } from './themes/deep-navy.js'
import { forestTheme, coralTheme, slateTheme, royalTheme } from './themes/extra.js'
import { GALLERY_THEMES } from './themes/gallery.js'
import { STYLE_PACK_THEMES, STYLE_PACK_CATEGORY } from './themes/packs.js'
import { DESIGN_DIVERSITY_THEMES, DESIGN_DIVERSITY_CATEGORY } from './themes/design-diversity.js'
import { COMMUNITY_THEMES, COMMUNITY_CATEGORY } from './themes/design-community.js'
import { withDesignSystem } from './themes/design-systems.js'

/** 레이아웃 레지스트리 — 추가는 이 배열에 1줄 (분기문 증식 금지) */
const LAYOUT_LIST: LayoutRuntime[] = [
  defineLayout(titleLayout),
  defineLayout(agendaLayout),
  defineLayout(bulletsLayout),
  defineLayout(twoColLayout),
  defineLayout(statLayout),
  defineLayout(quoteLayout),
  defineLayout(chartLayout),
  defineLayout(processLayout),
  // P11.3 디자인 엔진 — 리치 레이아웃 확장(레퍼런스급 다양성)
  defineLayout(timelineLayout),
  defineLayout(comparisonLayout),
  defineLayout(kpiLayout),
  defineLayout(cardsLayout),
  defineLayout(bignumLayout),
  defineLayout(roadmapLayout),
  defineLayout(closingLayout),
  defineLayout(referencesLayout), // hidden: LLM 카탈로그 제외, 시스템 자동 생성
]

const LAYOUTS: ReadonlyMap<string, LayoutRuntime> = new Map(
  LAYOUT_LIST.map((l) => [l.key, l]),
)

export function getLayout(key: string): LayoutRuntime {
  const layout = LAYOUTS.get(key)
  if (!layout) {
    throw new Error(`등록되지 않은 layoutType: ${key} (사용 가능: ${[...LAYOUTS.keys()].join(', ')})`)
  }
  return layout
}

export function listLayouts(): LayoutRuntime[] {
  return [...LAYOUTS.values()]
}

/** LLM에 제공되는 레이아웃 카탈로그(선택 가이드) — 프롬프트 재료. hidden 레이아웃 제외 */
export function layoutCatalogForLlm(): Array<{ key: string; description: string }> {
  return listLayouts()
    .filter((l) => !l.hidden)
    .map((l) => ({ key: l.key, description: l.description }))
}

// 모든 테마에 디자인 시스템(style)을 매핑 — 색/폰트를 넘어 골격까지 시스템 단위로 차별화(P11)
const THEME_LIST: Theme[] = [
  stitchIndigoTheme,
  deepNavyTheme,
  forestTheme,
  coralTheme,
  slateTheme,
  royalTheme,
  ...GALLERY_THEMES,
  ...STYLE_PACK_THEMES,
  ...DESIGN_DIVERSITY_THEMES,
  ...COMMUNITY_THEMES,
].map(withDesignSystem)
const THEMES: ReadonlyMap<string, Theme> = new Map(THEME_LIST.map((t) => [t.id, t]))

export function getTheme(id: string): Theme {
  const theme = THEMES.get(id)
  if (!theme) {
    throw new Error(`등록되지 않은 themeId: ${id} (사용 가능: ${[...THEMES.keys()].join(', ')})`)
  }
  return theme
}

export function listThemes(): Theme[] {
  return [...THEMES.values()]
}

/** themeId가 등록된 테마인지 — throw 없이 안전하게 검사(발표 유형 기본 테마 폴백용) */
export function hasTheme(id: string): boolean {
  return THEMES.has(id)
}

const EXTRA_TEMPLATES: TemplateMeta[] = [
  { id: 'template-forest-green', name: 'Forest Green', category: 'business', themeId: 'forest-green', aspectRatios: ['16:9', '4:3', '9:16'], layoutTypes: LAYOUT_LIST.map((l) => l.key), source: 'builtin' },
  { id: 'template-coral-energy', name: 'Coral Energy', category: 'creative', themeId: 'coral-energy', aspectRatios: ['16:9', '4:3', '9:16'], layoutTypes: LAYOUT_LIST.map((l) => l.key), source: 'builtin' },
  { id: 'template-mono-slate', name: 'Mono Slate', category: 'minimal', themeId: 'mono-slate', aspectRatios: ['16:9', '4:3', '9:16'], layoutTypes: LAYOUT_LIST.map((l) => l.key), source: 'builtin' },
  { id: 'template-royal-purple', name: 'Royal Purple', category: 'creative', themeId: 'royal-purple', aspectRatios: ['16:9', '4:3', '9:16'], layoutTypes: LAYOUT_LIST.map((l) => l.key), source: 'builtin' },
]

// 갤러리 확장 템플릿(테마 1:1) — Canva/Genspark식 다양성
const ALL = LAYOUT_LIST.map((l) => l.key)
const AR = ['16:9', '4:3', '9:16'] as const
const GALLERY_TEMPLATES: TemplateMeta[] = [
  { id: 'template-midnight-tech', name: 'Midnight Tech', category: 'tech', themeId: 'midnight-tech', aspectRatios: [...AR], layoutTypes: ALL, source: 'builtin' },
  { id: 'template-sunset-warm', name: 'Sunset', category: 'creative', themeId: 'sunset-warm', aspectRatios: [...AR], layoutTypes: ALL, source: 'builtin' },
  { id: 'template-ocean-teal', name: 'Ocean Teal', category: 'business', themeId: 'ocean-teal', aspectRatios: [...AR], layoutTypes: ALL, source: 'builtin' },
  { id: 'template-charcoal-gold', name: 'Charcoal Gold', category: 'business', themeId: 'charcoal-gold', aspectRatios: [...AR], layoutTypes: ALL, source: 'builtin' },
  { id: 'template-blush-pastel', name: 'Blush', category: 'creative', themeId: 'blush-pastel', aspectRatios: [...AR], layoutTypes: ALL, source: 'builtin' },
  { id: 'template-emerald-corp', name: 'Emerald Corporate', category: 'business', themeId: 'emerald-corp', aspectRatios: [...AR], layoutTypes: ALL, source: 'builtin' },
  { id: 'template-violet-pop', name: 'Violet Pop', category: 'creative', themeId: 'violet-pop', aspectRatios: [...AR], layoutTypes: ALL, source: 'builtin' },
  { id: 'template-steel-blue', name: 'Steel Blue', category: 'tech', themeId: 'steel-blue', aspectRatios: [...AR], layoutTypes: ALL, source: 'builtin' },
  { id: 'template-sand-minimal', name: 'Sand', category: 'minimal', themeId: 'sand-minimal', aspectRatios: [...AR], layoutTypes: ALL, source: 'builtin' },
  { id: 'template-crimson-bold', name: 'Crimson Bold', category: 'creative', themeId: 'crimson-bold', aspectRatios: [...AR], layoutTypes: ALL, source: 'builtin' },
]

// 스타일 팩 템플릿(P11) — 테마 1:1, 타이포 페어링까지 차별화한 오리지널 팩
const STYLE_PACK_TEMPLATES: TemplateMeta[] = STYLE_PACK_THEMES.map((t) => ({
  id: `template-${t.id}`,
  name: t.name,
  category: (STYLE_PACK_CATEGORY[t.id] ?? 'business') as TemplateMeta['category'],
  themeId: t.id,
  aspectRatios: [...AR],
  layoutTypes: ALL,
  source: 'builtin',
}))

// design-diversity 반입 팩(60종) — 테마 1:1
const DESIGN_DIVERSITY_TEMPLATES: TemplateMeta[] = DESIGN_DIVERSITY_THEMES.map((t) => ({
  id: `template-${t.id}`,
  name: t.name,
  category: (DESIGN_DIVERSITY_CATEGORY[t.id] ?? 'creative') as TemplateMeta['category'],
  themeId: t.id,
  aspectRatios: [...AR],
  layoutTypes: ALL,
  source: 'builtin',
}))

// 유명 오픈소스 프레젠테이션 테마(reveal.js/Marp/Catppuccin) — 테마 1:1
const COMMUNITY_TEMPLATES: TemplateMeta[] = COMMUNITY_THEMES.map((t) => ({
  id: `template-${t.id}`,
  name: t.name,
  category: (COMMUNITY_CATEGORY[t.id] ?? 'minimal') as TemplateMeta['category'],
  themeId: t.id,
  aspectRatios: [...AR],
  layoutTypes: ALL,
  source: 'builtin',
}))

export const TEMPLATES: TemplateMeta[] = [
  {
    id: 'corporate-indigo',
    name: 'Corporate Indigo',
    category: 'business',
    themeId: 'stitch-indigo',
    aspectRatios: ['16:9'],
    layoutTypes: LAYOUT_LIST.map((l) => l.key),
    source: 'builtin',
  },
  {
    id: 'deep-navy-pitch',
    name: 'Deep Navy Pitch',
    category: 'business',
    themeId: 'deep-navy',
    aspectRatios: ['16:9'],
    layoutTypes: LAYOUT_LIST.map((l) => l.key),
    source: 'builtin',
  },
  ...EXTRA_TEMPLATES,
  ...GALLERY_TEMPLATES,
  ...STYLE_PACK_TEMPLATES,
  ...DESIGN_DIVERSITY_TEMPLATES,
  ...COMMUNITY_TEMPLATES,
]

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
import { stitchIndigoTheme } from './themes/stitch-indigo.js'
import { deepNavyTheme } from './themes/deep-navy.js'
import { forestTheme, coralTheme, slateTheme, royalTheme } from './themes/extra.js'

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

const THEME_LIST: Theme[] = [
  stitchIndigoTheme,
  deepNavyTheme,
  forestTheme,
  coralTheme,
  slateTheme,
  royalTheme,
]
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
]

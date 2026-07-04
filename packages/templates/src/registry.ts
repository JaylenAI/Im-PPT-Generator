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
import { stitchIndigoTheme } from './themes/stitch-indigo.js'
import { deepNavyTheme } from './themes/deep-navy.js'

/** 레이아웃 레지스트리 — 추가는 이 배열에 1줄 (분기문 증식 금지) */
const LAYOUT_LIST: LayoutRuntime[] = [
  defineLayout(titleLayout),
  defineLayout(agendaLayout),
  defineLayout(bulletsLayout),
  defineLayout(twoColLayout),
  defineLayout(statLayout),
  defineLayout(quoteLayout),
  defineLayout(chartLayout),
  defineLayout(closingLayout),
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

/** LLM에 제공되는 레이아웃 카탈로그(선택 가이드) — 프롬프트 재료 */
export function layoutCatalogForLlm(): Array<{ key: string; description: string }> {
  return listLayouts().map((l) => ({ key: l.key, description: l.description }))
}

const THEME_LIST: Theme[] = [stitchIndigoTheme, deepNavyTheme]
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
]

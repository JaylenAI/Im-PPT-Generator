import { Hono } from 'hono'
import { TEMPLATES, listThemes, layoutCatalogForLlm } from '@im-ppt/templates'
import { PRESENTATION_TYPES } from '@im-ppt/schema'

/** 템플릿/테마/레이아웃/발표유형 카탈로그 — 갤러리·생성 옵션 UI가 소비(읽기 전용, 빌트인) */
export const catalogRoutes = new Hono()
  .get('/templates', (c) => c.json({ data: TEMPLATES }))
  .get('/themes', (c) => c.json({ data: listThemes() }))
  .get('/layouts', (c) => c.json({ data: layoutCatalogForLlm() }))
  .get('/presentation-types', (c) => c.json({ data: PRESENTATION_TYPES }))

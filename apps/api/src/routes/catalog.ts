import { Hono } from 'hono'
import { TEMPLATES, listThemes, layoutCatalogForLlm, buildSampleDeck } from '@im-ppt/templates'
import { PRESENTATION_TYPES } from '@im-ppt/schema'

/** 템플릿/테마/레이아웃/발표유형 카탈로그 — 갤러리·생성 옵션 UI가 소비(읽기 전용, 빌트인) */
export const catalogRoutes = new Hono()
  .get('/templates', (c) => c.json({ data: TEMPLATES }))
  // 템플릿 미리보기 — LLM 없이 결정론적 샘플 덱(갤러리 썸네일/미리보기 모달이 렌더)
  .get('/templates/:id/sample', (c) => {
    const id = c.req.param('id')
    if (!TEMPLATES.some((t) => t.id === id)) {
      return c.json({ error: { code: 'NOT_FOUND', message: '템플릿을 찾을 수 없습니다' } }, 404)
    }
    return c.json({ data: buildSampleDeck(id) })
  })
  .get('/themes', (c) => c.json({ data: listThemes() }))
  .get('/layouts', (c) => c.json({ data: layoutCatalogForLlm() }))
  .get('/presentation-types', (c) => c.json({ data: PRESENTATION_TYPES }))

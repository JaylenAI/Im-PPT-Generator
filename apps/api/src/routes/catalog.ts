import { Hono } from 'hono'
import { TEMPLATES, listThemes, layoutCatalogForLlm, buildSampleDeck } from '@im-ppt/templates'
import { PRESENTATION_TYPES } from '@im-ppt/schema'
import type { AppDeps } from '../deps.js'
import { extractPptxBrandKit } from '../lib/pptx-extract.js'
import { buildCustomTemplate } from '../lib/custom-template.js'

const WORKSPACE_ID = process.env.WORKSPACE_ID ?? 'default'

/** 템플릿/테마/레이아웃/발표유형 카탈로그 + 커스텀 템플릿(PPTX 추출) */
export function catalogRoutes(deps: AppDeps) {
  return new Hono()
    // 빌트인 + 커스텀(내 템플릿) 병합 — 내 템플릿이 앞에
    .get('/templates', (c) => c.json({ data: [...deps.settings.getCustomTemplates(), ...TEMPLATES] }))
    // 템플릿 미리보기 — 빌트인은 themeId, 커스텀은 인라인 themeTokens로 렌더
    .get('/templates/:id/sample', (c) => {
      const id = c.req.param('id')
      const custom = deps.settings.getCustomTemplate(id)
      if (custom) return c.json({ data: buildSampleDeck(custom, custom.themeTokens) })
      const builtin = TEMPLATES.find((t) => t.id === id)
      if (!builtin) return c.json({ error: { code: 'NOT_FOUND', message: '템플릿을 찾을 수 없습니다' } }, 404)
      return c.json({ data: buildSampleDeck(builtin) })
    })
    // PPTX 업로드 → 색+폰트 추출 → 커스텀 템플릿 생성(P11.2 템플릿 흡수)
    .post('/templates/from-pptx', async (c) => {
      const body = await c.req.parseBody().catch(() => null)
      const file = body?.['file']
      const name = typeof body?.['name'] === 'string' && body['name'].trim() ? (body['name'] as string).trim() : undefined
      if (!(file instanceof File)) {
        return c.json({ error: { code: 'VALIDATION_FAILED', message: 'file(pptx) 필수' } }, 400)
      }
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const kit = await extractPptxBrandKit(buffer)
        const tplName = name ?? (file.name.replace(/\.pptx$/i, '').slice(0, 40) || '내 템플릿')
        const tpl = buildCustomTemplate(tplName, kit, WORKSPACE_ID)
        const saved = await deps.settings.addCustomTemplate(tpl)
        return c.json({ data: saved }, 201)
      } catch (e) {
        return c.json({ error: { code: 'PARSE_FAILED', message: (e as Error).message } }, 400)
      }
    })
    // 커스텀 템플릿 삭제(빌트인은 삭제 불가)
    .delete('/templates/:id', async (c) => {
      const ok = await deps.settings.removeCustomTemplate(c.req.param('id'))
      if (!ok) return c.json({ error: { code: 'NOT_FOUND', message: '커스텀 템플릿을 찾을 수 없습니다' } }, 404)
      return c.json({ data: { removed: true } })
    })
    .get('/themes', (c) => c.json({ data: listThemes() }))
    .get('/layouts', (c) => c.json({ data: layoutCatalogForLlm() }))
    .get('/presentation-types', (c) => c.json({ data: PRESENTATION_TYPES }))
}

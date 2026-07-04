import { Hono } from 'hono'
import { z } from 'zod'
import { getTheme } from '@im-ppt/templates'
import { exportDeckToPptx } from '@im-ppt/exporter'
import type { AppDeps, ExportArtifact } from '../deps.js'

const exportBody = z.object({ format: z.enum(['pptx']).default('pptx') })

let exportCounter = 0
const nextExportId = () => `export_${(exportCounter += 1)}`

function safeName(title: string): string {
  return title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'deck'
}

/** 덱 → PPTX 산출물. 생성 후 산출물 id 반환, 다운로드는 별도 GET(바이너리) */
export function exportRoutes(deps: AppDeps) {
  return new Hono()
    .post('/decks/:id/export', async (c) => {
      const deck = await deps.decks.get(c.req.param('id'))
      if (!deck) return c.json({ error: { code: 'NOT_FOUND', message: '덱을 찾을 수 없습니다' } }, 404)
      const parsed = exportBody.safeParse(await c.req.json().catch(() => ({})))
      const format = parsed.success ? parsed.data.format : 'pptx'

      // 테마 토큰 resolve — 빌트인 테마(P1). 커스텀 템플릿 테마는 P6에서 DB에서 주입
      const tokens = getTheme(deck.themeId).tokens
      const buffer = await exportDeckToPptx(deck, tokens, { includeNotes: true })
      const artifact: ExportArtifact = {
        id: nextExportId(),
        deckId: deck.id,
        format,
        buffer,
        filename: `${safeName(deck.title)}.${format}`,
      }
      deps.exports.put(artifact)
      return c.json({ data: { exportId: artifact.id, format, filename: artifact.filename } }, 201)
    })
    .get('/exports/:id/download', (c) => {
      const art = deps.exports.get(c.req.param('id'))
      if (!art) return c.json({ error: { code: 'NOT_FOUND', message: '산출물을 찾을 수 없습니다' } }, 404)
      // Buffer → Uint8Array 뷰(BodyInit 호환, 제로카피). 표준 Response 직접 반환
      const bytes = new Uint8Array(art.buffer.buffer, art.buffer.byteOffset, art.buffer.byteLength)
      // 한글 파일명은 HTTP 헤더(ByteString) 불가 → RFC 5987 인코딩 + ASCII 폴백
      const ascii = art.filename.replace(/[^\x20-\x7E]/g, '_')
      const encoded = encodeURIComponent(art.filename)
      return new Response(bytes, {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'Content-Disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`,
        },
      })
    })
}

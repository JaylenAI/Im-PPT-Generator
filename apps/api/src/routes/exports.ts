import { Hono } from 'hono'
import { z } from 'zod'
import JSZip from 'jszip'
import { CANVAS_SIZES } from '@im-ppt/schema'
import { getTheme } from '@im-ppt/templates'
import { exportDeckToPptx, renderDeckToPdf, renderDeckToPngs } from '@im-ppt/exporter'
import type { AppDeps, ExportArtifact } from '../deps.js'
import type { Env } from '../config/env.js'

const exportBody = z.object({ format: z.enum(['pptx', 'pdf', 'png']).default('pptx') })

const CONTENT_TYPE: Record<ExportArtifact['format'], string> = {
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  pdf: 'application/pdf',
  png: 'application/zip',
}
// png은 슬라이드별 PNG를 zip으로 묶으므로 확장자는 zip
const EXTENSION: Record<ExportArtifact['format'], string> = { pptx: 'pptx', pdf: 'pdf', png: 'zip' }

let exportCounter = 0
const nextExportId = () => `export_${(exportCounter += 1)}`

function safeName(title: string): string {
  return title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'deck'
}

/** 슬라이드별 PNG 버퍼 → 단일 zip(slide-01.png …) */
async function zipPngs(pngs: Buffer[], baseName: string): Promise<Buffer> {
  const zip = new JSZip()
  pngs.forEach((buf, i) => {
    zip.file(`${baseName}-${String(i + 1).padStart(2, '0')}.png`, buf)
  })
  return zip.generateAsync({ type: 'nodebuffer' })
}

/** 덱 → PPTX/PDF/PNG(zip) 산출물. 생성 후 산출물 id 반환, 다운로드는 별도 GET(바이너리) */
export function exportRoutes(deps: AppDeps, env: Env) {
  return new Hono()
    .post('/decks/:id/export', async (c) => {
      const deck = await deps.decks.get(c.req.param('id'))
      if (!deck) return c.json({ error: { code: 'NOT_FOUND', message: '덱을 찾을 수 없습니다' } }, 404)
      const parsed = exportBody.safeParse(await c.req.json().catch(() => ({})))
      const format = parsed.success ? parsed.data.format : 'pptx'

      // 테마 토큰 resolve — 브랜드킷 오버라이드가 있으면 그 인라인 토큰(웹과 동일 시각)
      const tokens = deck.themeOverride ?? getTheme(deck.themeId).tokens
      const base = safeName(deck.title)

      let buffer: Buffer
      try {
        if (format === 'pptx') {
          buffer = await exportDeckToPptx(deck, tokens, { includeNotes: true })
        } else {
          // PDF/PNG는 실행 중인 웹 /print 페이지를 헤드리스로 렌더(WYSIWYG)
          const url = `${env.WEB_ORIGIN}/print/${deck.id}`
          const canvas = CANVAS_SIZES[deck.aspectRatio]
          if (format === 'pdf') {
            buffer = await renderDeckToPdf({ url, canvas })
          } else {
            const pngs = await renderDeckToPngs({ url, canvas })
            buffer = await zipPngs(pngs, base)
          }
        }
      } catch (err) {
        return c.json(
          {
            error: {
              code: 'EXPORT_FAILED',
              message: `${format.toUpperCase()} 생성 실패: ${err instanceof Error ? err.message : String(err)}`,
            },
          },
          500,
        )
      }

      const artifact: ExportArtifact = {
        id: nextExportId(),
        deckId: deck.id,
        format,
        buffer,
        filename: `${base}.${EXTENSION[format]}`,
        contentType: CONTENT_TYPE[format],
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
          'Content-Type': art.contentType,
          'Content-Disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`,
        },
      })
    })
}

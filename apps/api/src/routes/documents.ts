import { Hono } from 'hono'
import { parseDocument } from '../lib/document-parse.js'

const MAX_BYTES = 10 * 1024 * 1024 // 10MB

/**
 * 문서 인제스트(P7) — 업로드 파일을 텍스트로 추출해 반환.
 * 웹이 이 텍스트를 user_text 소스로 생성 요청에 실어 덱을 만든다.
 */
export function documentRoutes() {
  return new Hono().post('/documents/extract', async (c) => {
    const body = await c.req.parseBody().catch(() => null)
    const file = body?.['file']
    if (!(file instanceof File)) {
      return c.json({ error: { code: 'VALIDATION_FAILED', message: 'file(멀티파트) 필수' } }, 400)
    }
    if (file.size > MAX_BYTES) {
      return c.json({ error: { code: 'VALIDATION_FAILED', message: '파일이 10MB를 초과합니다' } }, 400)
    }
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const text = await parseDocument(buffer, file.name)
      if (text.length === 0) {
        return c.json({ error: { code: 'EMPTY', message: '추출된 텍스트가 없습니다' } }, 400)
      }
      return c.json({ data: { filename: file.name, chars: text.length, text: text.slice(0, 50000) } })
    } catch (e) {
      return c.json({ error: { code: 'PARSE_FAILED', message: (e as Error).message } }, 400)
    }
  })
}

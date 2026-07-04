import { Hono } from 'hono'
import { z } from 'zod'
import { redactConnection } from '@im-ppt/core'
import type { AppDeps } from '../deps.js'

const promptOverrideBody = z.object({ content: z.string() })

/**
 * AI 설정 라우트 — "설정창에서 AI 자유 커스터마이징"의 백엔드(GC-Agent 방식).
 * 설정 화면은 이 API를 소비만 한다(ADR-007). apiKey는 응답 시 마스킹.
 */
export function settingsRoutes(deps: AppDeps) {
  return new Hono()
    .get('/models', (c) =>
      c.json({
        data: {
          connections: deps.registry.listConnections().map(redactConnection),
          assignments: deps.registry.getAssignments(),
        },
      }),
    )
    .get('/prompts', (c) => c.json({ data: deps.prompts.list() }))
    .patch('/prompts/:key', async (c) => {
      const key = c.req.param('key') as Parameters<typeof deps.prompts.setOverride>[0]
      const known = deps.prompts.list().some((p) => p.key === key)
      if (!known) return c.json({ error: { code: 'NOT_FOUND', message: '알 수 없는 프롬프트 키' } }, 404)
      const parsed = promptOverrideBody.safeParse(await c.req.json().catch(() => null))
      if (!parsed.success) {
        return c.json({ error: { code: 'VALIDATION_FAILED', message: 'content 필수' } }, 400)
      }
      // 빈 문자열이면 기본값 복귀(GC-Agent PATCH 동작)
      deps.prompts.setOverride(key, parsed.data.content)
      return c.json({ data: deps.prompts.list().find((p) => p.key === key) })
    })
}

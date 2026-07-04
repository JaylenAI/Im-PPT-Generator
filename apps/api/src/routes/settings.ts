import { Hono } from 'hono'
import { z } from 'zod'
import { redactConnection } from '@im-ppt/core'
import { APP_SETTINGS_CATALOG } from '@im-ppt/schema'
import type { AppDeps } from '../deps.js'

const promptOverrideBody = z.object({ content: z.string() })

/**
 * AI 설정 라우트 — "설정창에서 AI 자유 커스터마이징"의 백엔드(GC-Agent 방식).
 * 설정 화면은 이 API를 소비만 한다(ADR-007). apiKey는 응답 시 마스킹.
 * 프롬프트 오버라이드·앱 기본값은 DB 영속(SettingsService) + 즉시 반영(핫리로드).
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
      const key = c.req.param('key')
      const known = deps.prompts.list().some((p) => p.key === key)
      if (!known) return c.json({ error: { code: 'NOT_FOUND', message: '알 수 없는 프롬프트 키' } }, 404)
      const parsed = promptOverrideBody.safeParse(await c.req.json().catch(() => null))
      if (!parsed.success) {
        return c.json({ error: { code: 'VALIDATION_FAILED', message: 'content 필수' } }, 400)
      }
      // 빈 문자열이면 기본값 복귀(GC-Agent PATCH 동작). 메모리+DB 동시 반영.
      await deps.settings.setPromptOverride(key, parsed.data.content)
      return c.json({ data: deps.prompts.list().find((p) => p.key === key) })
    })
    // 동적 카탈로그 — 설정 화면이 필드를 하드코딩 없이 렌더(타입드 카탈로그)
    .get('/catalog', (c) =>
      c.json({ data: { app: { fields: APP_SETTINGS_CATALOG, values: deps.settings.getApp() } } }),
    )
    // 브랜드킷(P6) — 색/폰트 오버라이드. 다음 생성부터 덱 테마에 반영
    .get('/brand-kit', (c) => c.json({ data: deps.settings.getBrandKit() }))
    .patch('/brand-kit', async (c) => {
      const body = await c.req.json().catch(() => null)
      try {
        return c.json({ data: await deps.settings.setBrandKit(body ?? {}) })
      } catch (e) {
        return c.json({ error: { code: 'VALIDATION_FAILED', message: (e as Error).message } }, 400)
      }
    })
    // 앱 기본값 — 조회/부분 갱신(영속). 다음 생성부터 반영
    .get('/app', (c) => c.json({ data: deps.settings.getApp() }))
    .patch('/app', async (c) => {
      const body = await c.req.json().catch(() => null)
      if (!body || typeof body !== 'object') {
        return c.json({ error: { code: 'VALIDATION_FAILED', message: '객체 본문 필요' } }, 400)
      }
      try {
        // patchApp이 현재값에 사용자 제공 키만 오버레이 후 검증(미지정 필드 보존)
        const updated = await deps.settings.patchApp(body)
        return c.json({ data: updated })
      } catch (e) {
        return c.json({ error: { code: 'VALIDATION_FAILED', message: (e as Error).message } }, 400)
      }
    })
}

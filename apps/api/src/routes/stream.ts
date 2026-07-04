import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { z } from 'zod'
import {
  userSourceInputSchema,
  type AppSettings,
  type GenerationConfig,
  type UserSourceInput,
} from '@im-ppt/schema'
import type { AppDeps } from '../deps.js'
import type { Worker } from '../lib/worker.js'
import { tailJob } from '../lib/worker.js'
import { buildConfig } from '../lib/build-config.js'
import { newDeckId, newJobId } from '../lib/ids.js'

const createBody = z.object({ prompt: z.string().min(1), sources: z.array(userSourceInputSchema).optional() }).passthrough()

interface ParsedRequest {
  config: GenerationConfig
  userSources: UserSourceInput[]
}

function parseRequest(app: AppSettings, raw: unknown): ParsedRequest | { error: string } {
  const parsed = createBody.safeParse(raw)
  if (!parsed.success) return { error: 'prompt는 필수입니다' }
  try {
    return {
      config: buildConfig(app, parsed.data as Record<string, unknown>),
      userSources: parsed.data.sources ?? [],
    }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

/**
 * 스트리밍 생성(P2 잡큐) — 요청은 잡을 enqueue하고 워커가 detach 처리한다.
 * POST /decks/stream : enqueue 후 그 잡을 즉시 tail(연결 끊겨도 잡은 계속 → 재접속 가능)
 * POST /decks/generate : enqueue만 하고 {jobId,deckId} 반환(완전 detach)
 * GET  /jobs/:id/stream : 기존/실행중 잡에 재접속해 처음부터 재생 + 라이브 tail
 */
export function streamRoutes(deps: AppDeps, worker: Worker) {
  return new Hono()
    .post('/decks/stream', async (c) => {
      const req = parseRequest(deps.settings.getApp(), await c.req.json().catch(() => null))
      if ('error' in req) {
        return c.json({ error: { code: 'VALIDATION_FAILED', message: req.error } }, 400)
      }
      const jobId = newJobId()
      const deckId = newDeckId()
      await deps.jobs.enqueue({ id: jobId, deckId, config: req.config, userSources: req.userSources })
      // kick — 백그라운드 루프가 없어도(또는 있어도, 원자적 claim) 즉시 처리 시작
      void worker.processOne().catch(() => {})
      return streamSSE(c, async (stream) => {
        await tailJob(deps.jobs, jobId, (event) => stream.writeSSE({ data: JSON.stringify(event) }), {
          isAborted: () => c.req.raw.signal.aborted,
        })
      })
    })
    .post('/decks/generate', async (c) => {
      const req = parseRequest(deps.settings.getApp(), await c.req.json().catch(() => null))
      if ('error' in req) {
        return c.json({ error: { code: 'VALIDATION_FAILED', message: req.error } }, 400)
      }
      const jobId = newJobId()
      const deckId = newDeckId()
      await deps.jobs.enqueue({ id: jobId, deckId, config: req.config, userSources: req.userSources })
      void worker.processOne().catch(() => {})
      return c.json({ data: { jobId, deckId } }, 202)
    })
    .get('/jobs/:id', async (c) => {
      const job = await deps.jobs.get(c.req.param('id'))
      if (!job) return c.json({ error: { code: 'NOT_FOUND', message: '잡을 찾을 수 없습니다' } }, 404)
      return c.json({
        data: {
          id: job.id,
          deckId: job.deckId,
          status: job.status,
          error: job.error,
          attempts: job.attempts,
          eventCount: job.events.length,
        },
      })
    })
    .get('/jobs/:id/stream', async (c) => {
      const job = await deps.jobs.get(c.req.param('id'))
      if (!job) return c.json({ error: { code: 'NOT_FOUND', message: '잡을 찾을 수 없습니다' } }, 404)
      return streamSSE(c, async (stream) => {
        await tailJob(deps.jobs, job.id, (event) => stream.writeSSE({ data: JSON.stringify(event) }), {
          isAborted: () => c.req.raw.signal.aborted,
        })
      })
    })
}

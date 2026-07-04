import { afterAll, describe, expect, it } from 'vitest'
import type { GenerationConfig } from '@im-ppt/schema'
import {
  MemoryJobStore,
  PgJobStore,
  backoffMs,
  createDb,
  ensureSchema,
  type BackoffPolicy,
} from '../src/index.js'

const config = { prompt: '테스트', slideCount: 3 } as unknown as GenerationConfig

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

describe('backoffMs', () => {
  it('지수 증가 후 cap', () => {
    const p: BackoffPolicy = { baseMs: 1000, capMs: 10000, staleSeconds: 300 }
    expect(backoffMs(1, p)).toBe(1000)
    expect(backoffMs(2, p)).toBe(2000)
    expect(backoffMs(3, p)).toBe(4000)
    expect(backoffMs(4, p)).toBe(8000)
    expect(backoffMs(5, p)).toBe(10000) // cap
    expect(backoffMs(10, p)).toBe(10000)
  })
})

describe('MemoryJobStore', () => {
  it('enqueue → queued 상태로 조회', async () => {
    const store = new MemoryJobStore()
    const job = await store.enqueue({ id: 'j1', deckId: 'd1', config })
    expect(job.status).toBe('queued')
    expect(job.deckId).toBe('d1')
    expect((await store.get('j1'))?.status).toBe('queued')
  })

  it('claim은 원자적 — 한 잡을 두 번 집지 못한다', async () => {
    const store = new MemoryJobStore()
    await store.enqueue({ id: 'j1', deckId: 'd1', config })
    const first = await store.claim()
    expect(first?.id).toBe('j1')
    expect(first?.status).toBe('running')
    expect(first?.attempts).toBe(1)
    const second = await store.claim()
    expect(second).toBeUndefined()
  })

  it('appendEvent/resetEvents — 재생 로그 관리', async () => {
    const store = new MemoryJobStore()
    await store.enqueue({ id: 'j1', deckId: 'd1', config })
    await store.appendEvent('j1', { type: 'job_started', jobId: 'j1', deckId: 'd1' })
    await store.appendEvent('j1', { type: 'deck_done', deckId: 'd1' })
    expect((await store.get('j1'))?.events).toHaveLength(2)
    await store.resetEvents('j1')
    expect((await store.get('j1'))?.events).toHaveLength(0)
  })

  it('complete → done', async () => {
    const store = new MemoryJobStore()
    await store.enqueue({ id: 'j1', deckId: 'd1', config })
    await store.claim()
    await store.complete('j1')
    expect((await store.get('j1'))?.status).toBe('done')
  })

  it('fail — attempts<max면 백오프 재큐, 소진되면 error', async () => {
    const store = new MemoryJobStore({ baseMs: 1, capMs: 1, staleSeconds: 300 })
    await store.enqueue({ id: 'j1', deckId: 'd1', config }) // maxAttempts=3
    // 1차 시도
    await store.claim()
    let job = await store.fail('j1', '일시 오류')
    expect(job?.status).toBe('queued') // 재큐
    await sleep(3)
    // 2차
    await store.claim()
    job = await store.fail('j1', '또 오류')
    expect(job?.status).toBe('queued')
    await sleep(3)
    // 3차 — 소진
    await store.claim()
    job = await store.fail('j1', '최종 오류')
    expect(job?.status).toBe('error')
    expect(job?.error).toBe('최종 오류')
    expect(job?.attempts).toBe(3)
  })

  it('백오프 대기 중인 잡은 즉시 claim되지 않는다', async () => {
    const store = new MemoryJobStore({ baseMs: 10000, capMs: 10000, staleSeconds: 300 })
    await store.enqueue({ id: 'j1', deckId: 'd1', config })
    await store.claim()
    await store.fail('j1', '오류') // runAfter = now + 10s
    expect(await store.claim()).toBeUndefined() // 아직 대기
  })

  it('오래 잠긴 running은 크래시로 보고 재클레임(stale reclaim)', async () => {
    const store = new MemoryJobStore({ baseMs: 1, capMs: 1, staleSeconds: 0.01 }) // 10ms
    await store.enqueue({ id: 'j1', deckId: 'd1', config })
    const first = await store.claim()
    expect(first?.status).toBe('running')
    await sleep(30) // lockedAt이 stale 임계 초과
    const reclaimed = await store.claim()
    expect(reclaimed?.id).toBe('j1')
    expect(reclaimed?.attempts).toBe(2) // 재클레임으로 시도 증가
  })

  it('claim은 runAfter/삽입 순서대로(FIFO)', async () => {
    const store = new MemoryJobStore()
    await store.enqueue({ id: 'j1', deckId: 'd1', config })
    await store.enqueue({ id: 'j2', deckId: 'd2', config })
    expect((await store.claim())?.id).toBe('j1')
    expect((await store.claim())?.id).toBe('j2')
  })
})

/** 실 Postgres 통합 — DATABASE_URL 있을 때만(목 금지). docker compose up -d db 필요 */
const URL = process.env.DATABASE_URL
describe.skipIf(!URL)('PgJobStore (실 Postgres)', () => {
  const handle = createDb(URL!)
  // claim은 워크스페이스 전역이므로 테스트마다 고유 워크스페이스로 격리(교차 간섭·잔여 잡 방지)
  const ws = () => `jobtest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  afterAll(async () => {
    await handle.pool.query(`DELETE FROM jobs WHERE workspace_id LIKE 'jobtest_%'`)
    await handle.close()
  })

  it('enqueue → 원자적 claim → append → complete', async () => {
    await ensureSchema(handle)
    const store = new PgJobStore(handle.db, ws())
    const id = 'j1'
    await store.enqueue({ id, deckId: `${id}_deck`, config })
    const claimed = await store.claim()
    expect(claimed?.id).toBe(id)
    expect(claimed?.status).toBe('running')
    expect(claimed?.attempts).toBe(1)
    // 같은 잡 두 번 claim 불가(원자적)
    expect(await store.claim()).toBeUndefined()

    await store.appendEvent(id, { type: 'job_started', jobId: id, deckId: `${id}_deck` })
    await store.appendEvent(id, { type: 'deck_done', deckId: `${id}_deck` })
    expect((await store.get(id))?.events).toHaveLength(2)

    await store.resetEvents(id)
    expect((await store.get(id))?.events).toHaveLength(0)

    await store.complete(id)
    expect((await store.get(id))?.status).toBe('done')
  })

  it('userSources 영속(리서치 입력)', async () => {
    const store = new PgJobStore(handle.db, ws())
    await store.enqueue({
      id: 'j2',
      deckId: 'd2',
      config,
      userSources: [{ kind: 'user_text', text: '내 자료', title: '메모' }],
    })
    const claimed = await store.claim()
    expect(claimed?.userSources).toEqual([{ kind: 'user_text', text: '내 자료', title: '메모' }])
  })

  it('fail 백오프 재큐 후 소진 시 error', async () => {
    const store = new PgJobStore(handle.db, ws(), { baseMs: 1, capMs: 1, staleSeconds: 300 })
    const fid = 'jf'
    await store.enqueue({ id: fid, deckId: `${fid}_deck`, config })
    await store.claim()
    expect((await store.fail(fid, 'e1'))?.status).toBe('queued')
    await sleep(5)
    expect((await store.claim())?.id).toBe(fid) // 격리돼 반드시 우리 잡
    expect((await store.fail(fid, 'e2'))?.status).toBe('queued')
    await sleep(5)
    expect((await store.claim())?.id).toBe(fid)
    const final = await store.fail(fid, 'e3')
    expect(final?.status).toBe('error')
    expect(final?.attempts).toBe(3)
  })

  it('크래시 복구 — 오래 잠긴 running을 재클레임(서버 재시작 시나리오)', async () => {
    const wsId = ws()
    const store = new PgJobStore(handle.db, wsId)
    const rid = 'jr'
    await store.enqueue({ id: rid, deckId: `${rid}_deck`, config })
    await store.claim() // running, locked_at=now
    // 서버 크래시 모사 — locked_at을 6분 전으로(기본 stale 임계 5분 초과)
    await handle.pool.query(
      `UPDATE jobs SET locked_at = now() - interval '6 minutes' WHERE id = $1 AND workspace_id = $2`,
      [rid, wsId],
    )
    const reclaimed = await store.claim()
    expect(reclaimed?.id).toBe(rid)
    expect(reclaimed?.status).toBe('running')
    expect(reclaimed?.attempts).toBe(2) // 최초 claim + 재클레임
  })
})

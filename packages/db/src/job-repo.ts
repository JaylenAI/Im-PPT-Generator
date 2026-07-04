import { and, desc, eq, sql } from 'drizzle-orm'
import type { GenerationConfig, GenerationEvent, UserSourceInput } from '@im-ppt/schema'
import type { Db } from './client.js'
import { jobs, type JobStatus } from './schema.js'

/** 생성 잡의 도메인 표현 — 저장 컬럼에서 필요한 필드만 노출 */
export interface Job {
  id: string
  deckId: string
  status: JobStatus
  config: GenerationConfig
  userSources: UserSourceInput[]
  events: GenerationEvent[]
  error: string | null
  attempts: number
  maxAttempts: number
}

export interface EnqueueInput {
  id: string
  deckId: string
  config: GenerationConfig
  userSources?: UserSourceInput[]
}

/** 백오프 정책 — 지수 증가, cap. attempts는 방금 실패한 시도 횟수(1-based). */
export interface BackoffPolicy {
  baseMs: number
  capMs: number
  /** running이 이 시간보다 오래 잠겨 있으면 크래시로 보고 재큐(초) */
  staleSeconds: number
}

const DEFAULT_BACKOFF: BackoffPolicy = { baseMs: 2000, capMs: 60000, staleSeconds: 300 }

export function backoffMs(attempts: number, policy: BackoffPolicy = DEFAULT_BACKOFF): number {
  const exp = policy.baseMs * 2 ** Math.max(0, attempts - 1)
  return Math.min(exp, policy.capMs)
}

/**
 * 잡 저장소 — 생성 detach + 재접속 재생의 영속 계층.
 * claim은 원자적(FOR UPDATE SKIP LOCKED)이어서 워커 다중화에도 안전.
 */
export interface JobStore {
  enqueue(input: EnqueueInput): Promise<Job>
  get(id: string): Promise<Job | undefined>
  /** 처리 가능한 잡 하나를 원자적으로 running 전이시켜 반환. 없으면 undefined */
  claim(): Promise<Job | undefined>
  /** 이벤트 하나를 append — 재접속 재생의 원천 */
  appendEvent(id: string, event: GenerationEvent): Promise<void>
  /** 이벤트 로그 비우기 — 재시도 시작 시 호출해 재생이 최신 시도만 반영하도록 */
  resetEvents(id: string): Promise<void>
  /** 성공 종료 */
  complete(id: string): Promise<void>
  /** 실패 — attempts<max면 백오프 후 재큐, 아니면 error 확정. 갱신된 잡 반환 */
  fail(id: string, error: string): Promise<Job | undefined>
  list(limit?: number): Promise<Job[]>
}

interface RawJobRow {
  id: string
  deck_id: string
  status: JobStatus
  config: GenerationConfig
  user_sources: UserSourceInput[] | null
  events: GenerationEvent[] | null
  error: string | null
  attempts: number
  max_attempts: number
}

function rawToJob(row: RawJobRow): Job {
  return {
    id: row.id,
    deckId: row.deck_id,
    status: row.status,
    config: row.config,
    userSources: row.user_sources ?? [],
    events: row.events ?? [],
    error: row.error,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
  }
}

/** Postgres 잡 저장소 — 원자적 claim + 지수백오프 재큐. workspace 스코프. */
export class PgJobStore implements JobStore {
  constructor(
    private readonly db: Db,
    private readonly workspaceId = 'default',
    private readonly policy: BackoffPolicy = DEFAULT_BACKOFF,
  ) {}

  async enqueue(input: EnqueueInput): Promise<Job> {
    await this.db.insert(jobs).values({
      id: input.id,
      workspaceId: this.workspaceId,
      deckId: input.deckId,
      status: 'queued',
      config: input.config,
      userSources: input.userSources ?? [],
      events: [],
    })
    const job = await this.get(input.id)
    if (!job) throw new Error('잡 생성 직후 조회 실패')
    return job
  }

  async get(id: string): Promise<Job | undefined> {
    const rows = await this.db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, id), eq(jobs.workspaceId, this.workspaceId)))
      .limit(1)
    const row = rows[0]
    if (!row) return undefined
    return {
      id: row.id,
      deckId: row.deckId,
      status: row.status,
      config: row.config,
      userSources: row.userSources ?? [],
      events: row.events ?? [],
      error: row.error,
      attempts: row.attempts,
      maxAttempts: row.maxAttempts,
    }
  }

  async claim(): Promise<Job | undefined> {
    // 큐 대기(run_after 도래) 또는 크래시 추정(오래 잠긴 running)을 한 번에 집는다.
    const res = await this.db.execute(sql`
      UPDATE jobs SET status = 'running', locked_at = now(), attempts = attempts + 1, updated_at = now()
      WHERE id = (
        SELECT id FROM jobs
        WHERE workspace_id = ${this.workspaceId}
          AND (
            (status = 'queued' AND run_after <= now())
            OR (status = 'running' AND locked_at < now() - make_interval(secs => ${this.policy.staleSeconds}))
          )
        ORDER BY run_after ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING id, deck_id, status, config, user_sources, events, error, attempts, max_attempts
    `)
    const row = (res.rows as unknown as RawJobRow[])[0]
    return row ? rawToJob(row) : undefined
  }

  async appendEvent(id: string, event: GenerationEvent): Promise<void> {
    await this.db
      .update(jobs)
      .set({
        events: sql`${jobs.events} || ${JSON.stringify([event])}::jsonb`,
        updatedAt: new Date(),
      })
      .where(and(eq(jobs.id, id), eq(jobs.workspaceId, this.workspaceId)))
  }

  async resetEvents(id: string): Promise<void> {
    await this.db
      .update(jobs)
      .set({ events: [], updatedAt: new Date() })
      .where(and(eq(jobs.id, id), eq(jobs.workspaceId, this.workspaceId)))
  }

  async complete(id: string): Promise<void> {
    await this.db
      .update(jobs)
      .set({ status: 'done', lockedAt: null, error: null, updatedAt: new Date() })
      .where(and(eq(jobs.id, id), eq(jobs.workspaceId, this.workspaceId)))
  }

  async fail(id: string, error: string): Promise<Job | undefined> {
    const job = await this.get(id)
    if (!job) return undefined
    if (job.attempts < job.maxAttempts) {
      const delay = backoffMs(job.attempts, this.policy)
      await this.db
        .update(jobs)
        .set({
          status: 'queued',
          runAfter: new Date(Date.now() + delay),
          lockedAt: null,
          error,
          updatedAt: new Date(),
        })
        .where(and(eq(jobs.id, id), eq(jobs.workspaceId, this.workspaceId)))
    } else {
      await this.db
        .update(jobs)
        .set({ status: 'error', lockedAt: null, error, updatedAt: new Date() })
        .where(and(eq(jobs.id, id), eq(jobs.workspaceId, this.workspaceId)))
    }
    return this.get(id)
  }

  async list(limit = 50): Promise<Job[]> {
    const rows = await this.db
      .select()
      .from(jobs)
      .where(eq(jobs.workspaceId, this.workspaceId))
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
    return rows.map((row) => ({
      id: row.id,
      deckId: row.deckId,
      status: row.status,
      config: row.config,
      userSources: row.userSources ?? [],
      events: row.events ?? [],
      error: row.error,
      attempts: row.attempts,
      maxAttempts: row.maxAttempts,
    }))
  }
}

interface MemJobRecord extends Job {
  lockedAt: number | null
  runAfter: number
  createdAt: number
}

/** 인메모리 잡 저장소 — DATABASE_URL 없을 때 폴백 + 테스트. Pg와 동일 계약/의미. */
export class MemoryJobStore implements JobStore {
  private items = new Map<string, MemJobRecord>()
  private seq = 0

  constructor(private readonly policy: BackoffPolicy = DEFAULT_BACKOFF) {}

  private toJob(r: MemJobRecord): Job {
    return {
      id: r.id,
      deckId: r.deckId,
      status: r.status,
      config: r.config,
      userSources: [...r.userSources],
      events: [...r.events],
      error: r.error,
      attempts: r.attempts,
      maxAttempts: r.maxAttempts,
    }
  }

  async enqueue(input: EnqueueInput): Promise<Job> {
    const rec: MemJobRecord = {
      id: input.id,
      deckId: input.deckId,
      status: 'queued',
      config: input.config,
      userSources: input.userSources ?? [],
      events: [],
      error: null,
      attempts: 0,
      maxAttempts: 3,
      lockedAt: null,
      runAfter: Date.now(),
      createdAt: Date.now() + this.seq++, // 삽입 순서 안정화(동일 ms 대비)
    }
    this.items.set(rec.id, rec)
    return this.toJob(rec)
  }

  async get(id: string): Promise<Job | undefined> {
    const r = this.items.get(id)
    return r ? this.toJob(r) : undefined
  }

  async claim(): Promise<Job | undefined> {
    const now = Date.now()
    const staleMs = this.policy.staleSeconds * 1000
    const eligible = [...this.items.values()]
      .filter(
        (r) =>
          (r.status === 'queued' && r.runAfter <= now) ||
          (r.status === 'running' && r.lockedAt !== null && r.lockedAt < now - staleMs),
      )
      .sort((a, b) => a.runAfter - b.runAfter || a.createdAt - b.createdAt)
    const rec = eligible[0]
    if (!rec) return undefined
    rec.status = 'running'
    rec.lockedAt = now
    rec.attempts += 1
    return this.toJob(rec)
  }

  async appendEvent(id: string, event: GenerationEvent): Promise<void> {
    const r = this.items.get(id)
    if (r) r.events = [...r.events, event]
  }

  async resetEvents(id: string): Promise<void> {
    const r = this.items.get(id)
    if (r) r.events = []
  }

  async complete(id: string): Promise<void> {
    const r = this.items.get(id)
    if (r) {
      r.status = 'done'
      r.lockedAt = null
      r.error = null
    }
  }

  async fail(id: string, error: string): Promise<Job | undefined> {
    const r = this.items.get(id)
    if (!r) return undefined
    if (r.attempts < r.maxAttempts) {
      r.status = 'queued'
      r.runAfter = Date.now() + backoffMs(r.attempts, this.policy)
      r.lockedAt = null
      r.error = error
    } else {
      r.status = 'error'
      r.lockedAt = null
      r.error = error
    }
    return this.toJob(r)
  }

  async list(limit = 50): Promise<Job[]> {
    return [...this.items.values()]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
      .map((r) => this.toJob(r))
  }
}

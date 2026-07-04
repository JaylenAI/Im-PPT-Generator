import pg from 'pg'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from './schema.js'

export type Db = NodePgDatabase<typeof schema>

export interface DbHandle {
  db: Db
  pool: pg.Pool
  close: () => Promise<void>
}

/** DATABASE_URL로 연결 풀 + drizzle 인스턴스 생성. 접근은 이 패키지만(ADR-007) */
export function createDb(databaseUrl: string): DbHandle {
  const pool = new pg.Pool({ connectionString: databaseUrl })
  const db = drizzle(pool, { schema })
  return { db, pool, close: () => pool.end() }
}

/** ensureSchema 직렬화용 advisory lock 키(임의 상수) — 동시 부팅 시 DDL 레이스 방지 */
const SCHEMA_LOCK_KEY = 727274

/**
 * 스키마 보장 — idempotent CREATE TABLE(마이그레이션 도구 대신 P2는 단순·확실하게).
 * advisory lock으로 직렬화: 여러 app 인스턴스/워커가 동시에 부팅해도
 * `CREATE TABLE IF NOT EXISTS` 동시 실행의 pg_class 충돌을 막는다(같은 커넥션에서 lock+DDL).
 */
export async function ensureSchema(handle: DbHandle): Promise<void> {
  const client = await handle.pool.connect()
  try {
    await client.query('SELECT pg_advisory_lock($1)', [SCHEMA_LOCK_KEY])
    await client.query(`
    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL DEFAULT 'default',
      title TEXT NOT NULL,
      deck JSONB NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS decks_workspace_idx ON decks (workspace_id, updated_at DESC);

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL DEFAULT 'default',
      deck_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      config JSONB NOT NULL,
      user_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
      events JSONB NOT NULL DEFAULT '[]'::jsonb,
      error TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      locked_at TIMESTAMPTZ,
      run_after TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    -- 기존 DB 진화: 컬럼 없으면 추가(idempotent)
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_sources JSONB NOT NULL DEFAULT '[]'::jsonb;
    -- 워커 claim이 스캔하는 인덱스(대기/스테일 후보를 run_after 순으로)
    CREATE INDEX IF NOT EXISTS jobs_claim_idx ON jobs (workspace_id, status, run_after);

    CREATE TABLE IF NOT EXISTS settings (
      workspace_id TEXT NOT NULL DEFAULT 'default',
      key TEXT NOT NULL,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (workspace_id, key)
    );
  `)
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [SCHEMA_LOCK_KEY]).catch(() => {})
    client.release()
  }
}

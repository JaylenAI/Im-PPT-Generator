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

/** 스키마 보장 — idempotent CREATE TABLE(마이그레이션 도구 대신 P2는 단순·확실하게) */
export async function ensureSchema(handle: DbHandle): Promise<void> {
  await handle.pool.query(`
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
  `)
}

import { pgTable, text, jsonb, timestamp, integer, primaryKey } from 'drizzle-orm/pg-core'
import type { Deck, GenerationConfig, GenerationEvent } from '@im-ppt/schema'

/**
 * 덱 테이블 — 덱 JSON을 JSONB로 저장(스키마 진화 유연, 전체 로드가 기본 액세스).
 * workspace_id로 앱 레이어 격리(ADR-006, 멀티테넌트 RLS 아님).
 */
export const decks = pgTable('decks', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().default('default'),
  title: text('title').notNull(),
  deck: jsonb('deck').$type<Deck>().notNull(),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type DeckRow = typeof decks.$inferSelect

/**
 * 생성 잡 테이블 — 생성을 요청 수명과 분리(detach)하고, 이벤트 로그를 영속해
 * 클라이언트가 재접속하면 처음부터 재생 가능(ADR-004). 워커가 FOR UPDATE SKIP LOCKED로 클레임.
 */
export const jobs = pgTable('jobs', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().default('default'),
  /** 이 잡이 만드는 덱 ID — 생성 시점에 확정해 이벤트가 참조하고 클라이언트가 미리 이동 가능 */
  deckId: text('deck_id').notNull(),
  status: text('status').$type<JobStatus>().notNull().default('queued'),
  config: jsonb('config').$type<GenerationConfig>().notNull(),
  /** 의미 단위 이벤트 append 로그 — 재접속 재생의 원천(SSOT) */
  events: jsonb('events').$type<GenerationEvent[]>().notNull().default([]),
  error: text('error'),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
  /** 워커가 클레임한 시각 — 오래된 running은 크래시로 보고 재큐 */
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  /** 백오프 스케줄링 — claim은 run_after<=now()만 집는다 */
  runAfter: timestamp('run_after', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type JobStatus = 'queued' | 'running' | 'done' | 'error'
export type JobRow = typeof jobs.$inferSelect

/**
 * 설정 KV — 프롬프트 오버라이드·앱 기본값을 워크스페이스 단위로 영속.
 * value는 JSONB(문자열/객체 모두). 부팅 시 rehydrate, 변경 즉시 반영(핫리로드).
 */
export const settings = pgTable(
  'settings',
  {
    workspaceId: text('workspace_id').notNull().default('default'),
    key: text('key').notNull(),
    value: jsonb('value').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.key] })],
)

export type SettingRow = typeof settings.$inferSelect

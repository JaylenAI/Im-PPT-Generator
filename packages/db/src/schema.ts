import { pgTable, text, jsonb, timestamp, integer } from 'drizzle-orm/pg-core'
import type { Deck } from '@im-ppt/schema'

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

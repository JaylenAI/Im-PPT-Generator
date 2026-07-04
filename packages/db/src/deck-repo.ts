import { and, desc, eq } from 'drizzle-orm'
import type { Deck } from '@im-ppt/schema'
import type { Db } from './client.js'
import { decks } from './schema.js'

/**
 * 덱 저장소 — 공통 DeckStore 인터페이스(인메모리/Postgres 교체 가능).
 * 라우트는 이 인터페이스만 안다.
 */
export interface DeckStore {
  put(deck: Deck): Promise<Deck>
  get(id: string): Promise<Deck | undefined>
  list(): Promise<Deck[]>
  delete(id: string): Promise<boolean>
}

/** Postgres 기반 저장소(Drizzle). workspace 스코프. upsert로 저장. */
export class PgDeckStore implements DeckStore {
  constructor(
    private readonly db: Db,
    private readonly workspaceId = 'default',
  ) {}

  async put(deck: Deck): Promise<Deck> {
    await this.db
      .insert(decks)
      .values({
        id: deck.id,
        workspaceId: this.workspaceId,
        title: deck.title,
        deck,
        version: deck.version,
      })
      .onConflictDoUpdate({
        target: decks.id,
        set: { title: deck.title, deck, version: deck.version, updatedAt: new Date() },
      })
    return deck
  }

  async get(id: string): Promise<Deck | undefined> {
    const rows = await this.db
      .select({ deck: decks.deck })
      .from(decks)
      .where(and(eq(decks.id, id), eq(decks.workspaceId, this.workspaceId)))
      .limit(1)
    return rows[0]?.deck
  }

  async list(): Promise<Deck[]> {
    const rows = await this.db
      .select({ deck: decks.deck })
      .from(decks)
      .where(eq(decks.workspaceId, this.workspaceId))
      .orderBy(desc(decks.updatedAt))
    return rows.map((r) => r.deck)
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.db
      .delete(decks)
      .where(and(eq(decks.id, id), eq(decks.workspaceId, this.workspaceId)))
      .returning({ id: decks.id })
    return res.length > 0
  }
}

/** 인메모리 저장소 — DATABASE_URL 없을 때 폴백. 동일 async 계약. */
export class MemoryDeckStore implements DeckStore {
  private items = new Map<string, Deck>()
  async put(deck: Deck): Promise<Deck> {
    this.items.set(deck.id, deck)
    return deck
  }
  async get(id: string): Promise<Deck | undefined> {
    return this.items.get(id)
  }
  async list(): Promise<Deck[]> {
    return [...this.items.values()].reverse()
  }
  async delete(id: string): Promise<boolean> {
    return this.items.delete(id)
  }
}

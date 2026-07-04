import { and, eq, like } from 'drizzle-orm'
import type { Db } from './client.js'
import { settings } from './schema.js'

export interface SettingEntry {
  key: string
  value: unknown
}

/**
 * 설정 KV 저장소 — 프롬프트 오버라이드·앱 기본값 영속.
 * key 규약: 'app.settings'(앱 기본값 객체), 'prompt.<promptKey>'(오버라이드 문자열).
 */
export interface SettingsStore {
  get(key: string): Promise<unknown | undefined>
  set(key: string, value: unknown): Promise<void>
  delete(key: string): Promise<void>
  /** prefix로 필터(예: 'prompt.') — 부팅 rehydrate에 사용 */
  getAll(prefix?: string): Promise<SettingEntry[]>
}

/** Postgres 설정 저장소(Drizzle upsert). workspace 스코프. */
export class PgSettingsStore implements SettingsStore {
  constructor(
    private readonly db: Db,
    private readonly workspaceId = 'default',
  ) {}

  async get(key: string): Promise<unknown | undefined> {
    const rows = await this.db
      .select({ value: settings.value })
      .from(settings)
      .where(and(eq(settings.key, key), eq(settings.workspaceId, this.workspaceId)))
      .limit(1)
    return rows[0]?.value
  }

  async set(key: string, value: unknown): Promise<void> {
    await this.db
      .insert(settings)
      .values({ workspaceId: this.workspaceId, key, value })
      .onConflictDoUpdate({
        target: [settings.workspaceId, settings.key],
        set: { value, updatedAt: new Date() },
      })
  }

  async delete(key: string): Promise<void> {
    await this.db
      .delete(settings)
      .where(and(eq(settings.key, key), eq(settings.workspaceId, this.workspaceId)))
  }

  async getAll(prefix?: string): Promise<SettingEntry[]> {
    const where = prefix
      ? and(eq(settings.workspaceId, this.workspaceId), like(settings.key, `${prefix}%`))
      : eq(settings.workspaceId, this.workspaceId)
    const rows = await this.db.select({ key: settings.key, value: settings.value }).from(settings).where(where)
    return rows.map((r) => ({ key: r.key, value: r.value }))
  }
}

/** 인메모리 설정 저장소 — DATABASE_URL 없을 때 폴백 + 테스트. */
export class MemorySettingsStore implements SettingsStore {
  private items = new Map<string, unknown>()

  async get(key: string): Promise<unknown | undefined> {
    return this.items.get(key)
  }
  async set(key: string, value: unknown): Promise<void> {
    this.items.set(key, value)
  }
  async delete(key: string): Promise<void> {
    this.items.delete(key)
  }
  async getAll(prefix?: string): Promise<SettingEntry[]> {
    return [...this.items.entries()]
      .filter(([k]) => !prefix || k.startsWith(prefix))
      .map(([key, value]) => ({ key, value }))
  }
}

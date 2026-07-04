import { ProviderRegistry, PromptStore, createDefaultRegistry } from '@im-ppt/core'
import {
  MemoryDeckStore,
  MemoryJobStore,
  MemorySettingsStore,
  type DeckStore,
  type JobStore,
} from '@im-ppt/db'
import { SettingsService } from './lib/settings-service.js'

/** 이펨럴 인메모리 저장소(export 산출물 등) — 재시작 시 재생성 가능해 영속 불필요 */
export class MemoryStore<T extends { id: string }> {
  private items = new Map<string, T>()
  put(item: T): T {
    this.items.set(item.id, item)
    return item
  }
  get(id: string): T | undefined {
    return this.items.get(id)
  }
  list(): T[] {
    return [...this.items.values()]
  }
  delete(id: string): boolean {
    return this.items.delete(id)
  }
}

export interface ExportArtifact {
  id: string
  deckId: string
  format: 'pptx' | 'pdf'
  buffer: Buffer
  filename: string
}

/**
 * 앱 의존성 — 라우트는 이것만 통해 도메인 로직에 접근(비즈니스 로직 직접 소유 금지, ADR-007).
 * decks는 DeckStore(비동기, Postgres/인메모리 교체 가능). 테스트는 MemoryDeckStore 주입.
 */
export interface AppDeps {
  registry: ProviderRegistry
  prompts: PromptStore
  decks: DeckStore
  jobs: JobStore
  settings: SettingsService
  exports: MemoryStore<ExportArtifact>
}

/** 기본 deps — DB 없이 인메모리(테스트/개발 폴백). 서버 기동은 index.ts에서 DB 배선 */
export function createDefaultDeps(): AppDeps {
  const prompts = new PromptStore()
  return {
    registry: createDefaultRegistry(),
    prompts,
    decks: new MemoryDeckStore(),
    jobs: new MemoryJobStore(),
    settings: new SettingsService(new MemorySettingsStore(), prompts),
    exports: new MemoryStore<ExportArtifact>(),
  }
}

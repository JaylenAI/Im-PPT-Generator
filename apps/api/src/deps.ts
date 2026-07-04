import type { Deck } from '@im-ppt/schema'
import { ProviderRegistry, PromptStore, createDefaultRegistry } from '@im-ppt/core'

/** 인메모리 저장소 — P1. P2에서 packages/db(Postgres)로 교체(동일 인터페이스) */
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
 * 테스트는 registry에 가짜 프로바이더를 주입해 오프라인 검증.
 */
export interface AppDeps {
  registry: ProviderRegistry
  prompts: PromptStore
  decks: MemoryStore<Deck>
  exports: MemoryStore<ExportArtifact>
}

export function createDefaultDeps(): AppDeps {
  return {
    registry: createDefaultRegistry(),
    prompts: new PromptStore(),
    decks: new MemoryStore<Deck>(),
    exports: new MemoryStore<ExportArtifact>(),
  }
}

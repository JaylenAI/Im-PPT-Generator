import { afterAll, describe, expect, it } from 'vitest'
import type { Deck } from '@im-ppt/schema'
import { MemoryDeckStore, PgDeckStore, createDb, ensureSchema } from '../src/index.js'

function fixture(id: string, title = '테스트 덱'): Deck {
  return {
    id, title, language: '한국어', aspectRatio: '16:9', themeId: 'stitch-indigo',
    slides: [{ id: 's1', layoutType: 'title', elements: [], notes: '', citationIds: [], status: 'draft' }],
    sources: [], citations: [], version: 1,
  }
}

describe('MemoryDeckStore', () => {
  it('put/get/list/delete가 async 계약을 지킨다', async () => {
    const store = new MemoryDeckStore()
    await store.put(fixture('d1'))
    expect((await store.get('d1'))?.title).toBe('테스트 덱')
    expect(await store.list()).toHaveLength(1)
    expect(await store.delete('d1')).toBe(true)
    expect(await store.get('d1')).toBeUndefined()
  })
})

/** 실 Postgres 통합 — DATABASE_URL 있을 때만(목 금지). docker compose up -d db 필요 */
const URL = process.env.DATABASE_URL
describe.skipIf(!URL)('PgDeckStore (실 Postgres)', () => {
  const handle = createDb(URL!)
  const store = new PgDeckStore(handle.db)
  const id = `test_${Date.now()}`

  afterAll(async () => {
    await store.delete(id)
    await handle.close()
  })

  it('스키마 보장 후 upsert/조회/목록/삭제', async () => {
    await ensureSchema(handle)
    await store.put(fixture(id, '영속 덱'))
    expect((await store.get(id))?.title).toBe('영속 덱')

    // upsert(같은 id 재저장) — 제목 갱신
    await store.put(fixture(id, '갱신된 덱'))
    expect((await store.get(id))?.title).toBe('갱신된 덱')

    const list = await store.list()
    expect(list.some((d) => d.id === id)).toBe(true)

    expect(await store.delete(id)).toBe(true)
    expect(await store.get(id)).toBeUndefined()
  })
})

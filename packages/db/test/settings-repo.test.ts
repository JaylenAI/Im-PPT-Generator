import { afterAll, describe, expect, it } from 'vitest'
import { MemorySettingsStore, PgSettingsStore, createDb, ensureSchema } from '../src/index.js'

describe('MemorySettingsStore', () => {
  it('set/get/delete + getAll(prefix)', async () => {
    const store = new MemorySettingsStore()
    await store.set('app.settings', { defaultLanguage: 'en' })
    await store.set('prompt.outline_system', '커스텀')
    await store.set('prompt.slide_system', '커스텀2')

    expect(await store.get('app.settings')).toEqual({ defaultLanguage: 'en' })
    expect((await store.getAll('prompt.')).length).toBe(2)
    expect((await store.getAll()).length).toBe(3)

    await store.delete('prompt.outline_system')
    expect(await store.get('prompt.outline_system')).toBeUndefined()
    expect((await store.getAll('prompt.')).length).toBe(1)
  })
})

/** 실 Postgres 통합 — DATABASE_URL 있을 때만 */
const URL = process.env.DATABASE_URL
describe.skipIf(!URL)('PgSettingsStore (실 Postgres)', () => {
  const handle = createDb(URL!)
  const store = new PgSettingsStore(handle.db)
  const key = `test.setting.${Date.now()}`

  afterAll(async () => {
    await handle.pool.query('DELETE FROM settings WHERE key = $1', [key])
    await handle.close()
  })

  it('upsert/조회/prefix/삭제', async () => {
    await ensureSchema(handle)
    await store.set(key, { a: 1 })
    expect(await store.get(key)).toEqual({ a: 1 })

    // upsert(같은 키 재저장) — 값 갱신
    await store.set(key, { a: 2 })
    expect(await store.get(key)).toEqual({ a: 2 })

    const all = await store.getAll(key)
    expect(all.some((e) => e.key === key)).toBe(true)

    await store.delete(key)
    expect(await store.get(key)).toBeUndefined()
  })
})

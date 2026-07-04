import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  ProviderRegistry,
  ModelConnectionMissing,
  createDefaultRegistry,
  type ModelConnection,
  type ProviderAdapter,
} from '../src/index.js'

const conn = (over: Partial<ModelConnection>): ModelConnection => ({
  id: 'c1',
  name: 'c1',
  provider: 'claude-cli',
  model: 'sonnet',
  tags: ['outline'],
  params: { adminOnly: false },
  isActive: true,
  ...over,
})

/** 결정적 가짜 프로바이더 — offline 단위 테스트용(실 CLI 아님) */
function fakeProvider(data: unknown): ProviderAdapter {
  return { kind: 'claude-cli', generateStructured: async () => ({ data }) }
}

describe('ProviderRegistry.resolveConnection', () => {
  it('명시 id가 최우선', () => {
    const r = new ProviderRegistry()
      .registerConnection(conn({ id: 'a', tags: ['outline'] }))
      .registerConnection(conn({ id: 'b', tags: ['outline'] }))
    expect(r.resolveConnection('outline', 'b').id).toBe('b')
  })

  it('작업 할당이 활성 첫 연결보다 우선', () => {
    const r = new ProviderRegistry()
      .registerConnection(conn({ id: 'a', tags: ['slide'] }))
      .registerConnection(conn({ id: 'b', tags: ['slide'] }))
      .assign('slide', 'b')
    expect(r.resolveConnection('slide').id).toBe('b')
  })

  it('할당 없으면 활성+태그 첫 연결', () => {
    const r = new ProviderRegistry()
      .registerConnection(conn({ id: 'a', tags: ['edit'], isActive: false }))
      .registerConnection(conn({ id: 'b', tags: ['edit'], isActive: true }))
    expect(r.resolveConnection('edit').id).toBe('b')
  })

  it('맞는 연결 없으면 ModelConnectionMissing(조용한 degrade 금지)', () => {
    const r = new ProviderRegistry().registerConnection(conn({ tags: ['outline'] }))
    expect(() => r.resolveConnection('image')).toThrow(ModelConnectionMissing)
  })

  it('없는 명시 id도 명확히 실패', () => {
    const r = new ProviderRegistry().registerConnection(conn({}))
    expect(() => r.resolveConnection('outline', 'nope')).toThrow(ModelConnectionMissing)
  })
})

describe('ProviderRegistry.generateStructured', () => {
  const schema = z.object({ greeting: z.string() })

  it('프로바이더 출력이 스키마 통과하면 파싱해 반환', async () => {
    const r = new ProviderRegistry()
      .registerProvider(fakeProvider({ greeting: 'hi' }))
      .registerConnection(conn({}))
    const res = await r.generateStructured('outline', 'p', schema)
    expect(res.data.greeting).toBe('hi')
    expect(res.connection.id).toBe('c1')
  })

  it('스키마 위반 출력이면 명확히 실패(2차 안전망)', async () => {
    const r = new ProviderRegistry()
      .registerProvider(fakeProvider({ wrong: true }))
      .registerConnection(conn({}))
    await expect(r.generateStructured('outline', 'p', schema)).rejects.toThrow(/스키마 검증 실패/)
  })
})

describe('createDefaultRegistry', () => {
  it('claude-cli sonnet/opus 연결이 전 작업 태그를 커버', () => {
    const r = createDefaultRegistry()
    expect(r.listConnections().map((c) => c.id).sort()).toEqual([
      'claude-cli-opus',
      'claude-cli-sonnet',
    ])
    for (const task of ['outline', 'slide', 'edit', 'research', 'vision', 'image'] as const) {
      expect(r.resolveConnection(task).provider).toBe('claude-cli')
    }
  })
})

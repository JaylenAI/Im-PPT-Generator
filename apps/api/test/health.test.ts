import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { loadEnv } from '../src/config/env.js'

describe('GET /api/v1/health', () => {
  it('200과 ok 상태를 반환한다', async () => {
    const res = await createApp().request('/api/v1/health')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { status: string } }
    expect(body.data.status).toBe('ok')
  })

  it('없는 경로는 표준 에러 포맷으로 404를 반환한다', async () => {
    const res = await createApp().request('/api/v1/nope')
    expect(res.status).toBe(404)
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe('NOT_FOUND')
  })
})

describe('loadEnv', () => {
  it('기본값을 채운다', () => {
    const env = loadEnv({})
    expect(env.PORT).toBe(8787)
    expect(env.LOG_LEVEL).toBe('info')
  })

  it('잘못된 PORT를 거부한다', () => {
    expect(() => loadEnv({ PORT: 'abc' })).toThrow()
  })
})

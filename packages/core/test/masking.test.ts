import { describe, expect, it } from 'vitest'
import {
  maskApiKey,
  isMaskedApiKey,
  redactConnection,
  mergeApiKeyOnWrite,
  type ModelConnection,
} from '../src/index.js'

describe('시크릿 마스킹', () => {
  it('긴 키는 앞4…뒤4로 마스킹', () => {
    expect(maskApiKey('sk-abcd1234wxyz')).toBe('sk-a…wxyz')
  })
  it('짧은 키는 ***', () => {
    expect(maskApiKey('short')).toBe('***')
  })
  it('마스킹된 값을 인식', () => {
    expect(isMaskedApiKey('sk-a…wxyz')).toBe(true)
    expect(isMaskedApiKey('***')).toBe(true)
    expect(isMaskedApiKey('sk-real-key-value')).toBe(false)
  })

  it('redactConnection이 apiKey를 마스킹', () => {
    const conn: ModelConnection = {
      id: 'a', name: 'a', provider: 'openai-compat', model: 'gpt-oss',
      baseUrl: 'https://x.test', apiKey: 'sk-secret-123456', tags: ['outline'],
      params: { adminOnly: false }, isActive: true,
    }
    expect(redactConnection(conn).apiKey).toBe('sk-s…3456')
  })

  it('마스킹된 값 되돌아오면 기존 키 보존(왕복 파괴 방지)', () => {
    expect(mergeApiKeyOnWrite('sk-s…3456', 'sk-secret-123456')).toBe('sk-secret-123456')
  })
  it('새 실제 키면 교체', () => {
    expect(mergeApiKeyOnWrite('sk-new-key-999', 'sk-old')).toBe('sk-new-key-999')
  })
  it('undefined면 기존 유지', () => {
    expect(mergeApiKeyOnWrite(undefined, 'sk-old')).toBe('sk-old')
  })
})

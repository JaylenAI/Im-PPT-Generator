import { describe, expect, it } from 'vitest'
import { modelParamsSchema, detectFamily, buildReasoningKwargs } from '../src/index.js'

describe('modelParamsSchema', () => {
  it('범위 밖 temperature를 거부(clamp가 아니라 검증)', () => {
    expect(modelParamsSchema.safeParse({ temperature: 3 }).success).toBe(false)
    expect(modelParamsSchema.safeParse({ temperature: 0.7 }).success).toBe(true)
  })

  it('알 수 없는 키는 drop(over-eager UI 방어)', () => {
    const p = modelParamsSchema.parse({ temperature: 0.5, bogus: 1 } as Record<string, unknown>)
    expect('bogus' in p).toBe(false)
  })

  it('adminOnly 기본 false', () => {
    expect(modelParamsSchema.parse({}).adminOnly).toBe(false)
  })
})

describe('detectFamily', () => {
  it('claude 별칭 인식', () => {
    expect(detectFamily('sonnet')).toBe('claude')
    expect(detectFamily('claude-sonnet-5')).toBe('claude')
  })
  it('구체적 패밀리 우선', () => {
    expect(detectFamily('gpt-oss-120b')).toBe('gpt-oss')
    expect(detectFamily('qwen3-32b')).toBe('qwen')
    expect(detectFamily('gemma4-27b')).toBe('gemma')
    expect(detectFamily('llama-3')).toBe('plain')
  })
})

describe('buildReasoningKwargs — 패밀리별 필드 번역', () => {
  it('gpt-oss: effort는 top, thinking off는 extraBody', () => {
    const { top, extraBody } = buildReasoningKwargs('gpt-oss-120b', {
      thinking: false,
      effort: 'high',
    })
    expect(top['reasoning_effort']).toBe('high')
    expect(extraBody['include_reasoning']).toBe(false)
  })

  it('qwen3: enable_thinking + budget를 chat_template_kwargs로', () => {
    const { extraBody } = buildReasoningKwargs('qwen3-32b', {
      thinking: true,
      thinkingTokenBudget: 2048,
    })
    expect(extraBody['chat_template_kwargs']).toEqual({
      enable_thinking: true,
      thinking_token_budget: 2048,
    })
  })

  it('claude: no-op(claude-cli는 --model만)', () => {
    const { top, extraBody } = buildReasoningKwargs('sonnet', { thinking: true })
    expect(top).toEqual({})
    expect(extraBody).toEqual({})
  })

  it('reasoning 없으면 빈 kwargs', () => {
    expect(buildReasoningKwargs('sonnet')).toEqual({ top: {}, extraBody: {} })
  })
})

import { sanitizeJsonSchema } from '../src/providers/schema-util.js'

describe('sanitizeJsonSchema (claude CLI 호환)', () => {
  it('$schema와 default를 재귀 제거한다', () => {
    const dirty = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: { a: { type: 'string', default: '' }, b: { type: 'array', items: { default: 1, type: 'number' } } },
    }
    const clean = sanitizeJsonSchema(dirty)
    expect('$schema' in clean).toBe(false)
    expect((clean.properties as any).a.default).toBeUndefined()
    expect((clean.properties as any).b.items.default).toBeUndefined()
    // 나머지는 보존
    expect((clean.properties as any).a.type).toBe('string')
  })
})

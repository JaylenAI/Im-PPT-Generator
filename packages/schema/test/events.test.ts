import { describe, expect, it } from 'vitest'
import { generationEventSchema } from '../src/index.js'

describe('generationEventSchema', () => {
  it('slide_delta 이벤트를 파싱한다 (부분 JSON patch 허용)', () => {
    const event = generationEventSchema.parse({
      type: 'slide_delta',
      slideId: 'slide_3',
      patch: { elements: [{ id: 'e1' }] },
    })
    expect(event.type).toBe('slide_delta')
  })

  it('HITL 게이트 이벤트 — 정의된 게이트만 허용한다', () => {
    expect(
      generationEventSchema.safeParse({ type: 'gate_waiting', gate: 'outline' }).success,
    ).toBe(true)
    expect(
      generationEventSchema.safeParse({ type: 'gate_waiting', gate: 'render' }).success,
    ).toBe(false)
  })

  it('알 수 없는 이벤트 타입을 거부한다', () => {
    expect(generationEventSchema.safeParse({ type: 'unknown_event' }).success).toBe(false)
  })

  it('export_ready — 지원 포맷만 허용한다', () => {
    expect(
      generationEventSchema.safeParse({ type: 'export_ready', format: 'pptx', url: '/x.pptx' })
        .success,
    ).toBe(true)
    expect(
      generationEventSchema.safeParse({ type: 'export_ready', format: 'key', url: '/x.key' })
        .success,
    ).toBe(false)
  })
})

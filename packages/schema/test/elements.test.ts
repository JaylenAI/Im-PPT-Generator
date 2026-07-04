import { describe, expect, it } from 'vitest'
import { slideElementSchema, colorSchema } from '../src/index.js'

const frame = { x: 0, y: 0, w: 100, h: 50 }

describe('slideElementSchema', () => {
  it('chart 요소 — 시리즈/라벨을 검증한다', () => {
    const chart = slideElementSchema.parse({
      id: 'c1',
      type: 'chart',
      chartType: 'bar',
      frame,
      data: { labels: ['2024', '2025'], series: [{ name: '매출', values: [10, 20] }] },
    })
    expect(chart.type).toBe('chart')
    if (chart.type === 'chart') expect(chart.options.showLegend).toBe(true)
  })

  it('chart 요소 — 빈 시리즈를 거부한다', () => {
    const result = slideElementSchema.safeParse({
      id: 'c2',
      type: 'chart',
      chartType: 'pie',
      frame,
      data: { labels: ['a'], series: [] },
    })
    expect(result.success).toBe(false)
  })

  it('table 요소 — 최소 1행을 요구한다', () => {
    expect(
      slideElementSchema.safeParse({ id: 't1', type: 'table', frame, rows: [] }).success,
    ).toBe(false)
  })

  it('shape 요소 — 음수 크기 frame을 거부한다', () => {
    const result = slideElementSchema.safeParse({
      id: 's1',
      type: 'shape',
      shape: 'rect',
      frame: { x: 0, y: 0, w: -10, h: 10 },
    })
    expect(result.success).toBe(false)
  })
})

describe('colorSchema', () => {
  it('hex와 테마 토큰 참조를 허용한다', () => {
    expect(colorSchema.safeParse('#4F46E5').success).toBe(true)
    expect(colorSchema.safeParse('token:colors.primary').success).toBe(true)
  })

  it('임의 문자열을 거부한다', () => {
    expect(colorSchema.safeParse('indigo').success).toBe(false)
    expect(colorSchema.safeParse('rgb(0,0,0)').success).toBe(false)
  })
})

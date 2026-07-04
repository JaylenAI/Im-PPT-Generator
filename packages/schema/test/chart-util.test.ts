import { describe, it, expect } from 'vitest'
import { computeWaterfall } from '../src/index.js'

describe('computeWaterfall', () => {
  it('증감이 누적되며 base가 떠 있는 막대를 만든다', () => {
    // 시작 100, +50, -30 → 누적 100,150,120
    const wf = computeWaterfall([100, 50, -30])
    expect(wf.cum).toEqual([100, 150, 120])
    // 1번째: 0~100 상승
    expect(wf.base[0]).toBe(0)
    expect(wf.rise[0]).toBe(100)
    // 2번째: 100~150 상승 → base=100
    expect(wf.base[1]).toBe(100)
    expect(wf.rise[1]).toBe(50)
    // 3번째: 120~150 하강 → base=120, fall=30
    expect(wf.base[2]).toBe(120)
    expect(wf.fall[2]).toBe(30)
    expect(wf.axisMax).toBe(150)
    expect(wf.axisMin).toBe(0)
  })

  it('waterfallTotalLast=true면 마지막을 0부터 그리는 총계 막대로', () => {
    const wf = computeWaterfall([100, 50, 150], true)
    expect(wf.isTotal).toEqual([false, false, true])
    expect(wf.base[2]).toBe(0) // 총계는 0부터
    expect(wf.rise[2]).toBe(150)
  })

  it('음수 누적도 axisMin이 따라간다', () => {
    const wf = computeWaterfall([-40, -30])
    expect(wf.cum).toEqual([-40, -70])
    expect(wf.axisMin).toBe(-70)
    expect(wf.axisMax).toBe(0)
  })
})

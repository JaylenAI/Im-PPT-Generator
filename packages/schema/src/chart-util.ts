/**
 * 워터폴 차트 계산 — 순차 증감이 누적에 미치는 영향을 "떠 있는 막대"로 표현.
 * PptxGenJS에 native 워터폴이 없어, 렌더러/익스포터가 공유하는 순수 계산을 여기 둔다.
 *
 * 규약: values는 각 항목의 증감(delta). waterfallTotalLast=true면 마지막 값은 총계(0부터 그림).
 */
export interface WaterfallSeries {
  /** 보이지 않는 하단 오프셋(막대가 떠 있는 높이) */
  base: number[]
  /** 증가분(양수 delta, 음수면 0) */
  rise: number[]
  /** 감소분 크기(음수 delta의 절대값, 양수면 0) */
  fall: number[]
  /** 각 막대까지의 누적값 */
  cum: number[]
  /** 총계 막대 여부 */
  isTotal: boolean[]
  /** 값 축 범위 */
  axisMin: number
  axisMax: number
}

export function computeWaterfall(values: number[], totalLast = false): WaterfallSeries {
  const base: number[] = []
  const rise: number[] = []
  const fall: number[] = []
  const cum: number[] = []
  const isTotal: boolean[] = []
  let running = 0

  values.forEach((v, i) => {
    const last = i === values.length - 1
    if (totalLast && last) {
      // 마지막은 총계 — 0부터 v까지 그리는 완전한 막대
      base.push(0)
      rise.push(v >= 0 ? v : 0)
      fall.push(v < 0 ? -v : 0)
      cum.push(v)
      isTotal.push(true)
    } else {
      const before = running
      running += v
      base.push(Math.min(before, running))
      rise.push(v >= 0 ? v : 0)
      fall.push(v < 0 ? -v : 0)
      cum.push(running)
      isTotal.push(false)
    }
  })

  const tops = base.map((b, i) => b + rise[i]! + fall[i]!)
  const axisMax = Math.max(0, ...tops)
  const axisMin = Math.min(0, ...base)
  return { base, rise, fall, cum, isTotal, axisMin, axisMax }
}

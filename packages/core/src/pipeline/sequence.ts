/**
 * 템플릿 레이아웃 시퀀스(P12) — 템플릿이 설계된 서사 순서(layoutOrder)를 가지면
 * 아웃라인 섹션의 layoutHint를 그 순서에 맞춰 정렬한다. 단, 콘텐츠-안전:
 * - 데이터/인용 레이아웃(chart/stat/kpi-grid/comparison/timeline/process/quote/references)은
 *   LLM이 콘텐츠 근거로 고른 것이므로 존중(덮어쓰지 않음).
 * - 시퀀스가 데이터 레이아웃을 요구해도 강제하지 않음(근거 없는 빈 차트 방지).
 * → 템플릿은 제목/구조/텍스트 슬롯의 흐름을 좌우하고, 데이터 시각화는 콘텐츠가 결정.
 */

/** 콘텐츠가 있어야 성립하는 레이아웃 — 양방향으로 존중(파괴도, 조작도 안 함) */
const RESPECT_LAYOUTS = new Set([
  'chart', 'stat', 'kpi-grid', 'comparison', 'timeline', 'process', 'quote', 'references',
])

export interface SequencableSection {
  layoutHint: string
}

/**
 * 섹션 layoutHint를 템플릿 순서에 맞춰 정렬(불변). order 없으면 원본 그대로.
 * positional 매핑(부족하면 순환), 첫 title·마지막 closing은 유지.
 */
export function alignLayoutsToSequence<T extends SequencableSection>(
  sections: T[],
  order: readonly string[] | undefined,
): T[] {
  if (!order || order.length === 0) return sections
  const last = sections.length - 1
  return sections.map((s, i) => {
    if (RESPECT_LAYOUTS.has(s.layoutHint)) return s // LLM의 콘텐츠 판단 존중
    if (i === 0 && s.layoutHint === 'title') return s
    if (i === last && s.layoutHint === 'closing') return s
    const want = order[i % order.length]!
    if (RESPECT_LAYOUTS.has(want)) return s // 시퀀스가 데이터 레이아웃 요구 → 강제 안 함
    return want === s.layoutHint ? s : { ...s, layoutHint: want }
  })
}

/** 아웃라인 프롬프트에 주입할 시퀀스 안내문. order 없으면 빈 문자열 */
export function layoutSequenceHint(order: readonly string[] | undefined): string {
  if (!order || order.length === 0) return ''
  return (
    `\n선택된 템플릿의 설계된 레이아웃 흐름(순서대로, ${order.length}종):\n` +
    `${order.join(' → ')}\n` +
    `이 흐름을 서사의 뼈대로 삼되, 수치·인용 등 콘텐츠가 있으면 stat/chart/quote를 우선하세요.`
  )
}

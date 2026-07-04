import type { Citation, Fact, Source } from '@im-ppt/schema'

export interface BuiltCitations {
  citations: Citation[]
  /** sourceId → citationId (슬라이드가 팩트→소스→인용으로 역추적) */
  sourceToCitation: Record<string, string>
}

/**
 * 인용 구성 — 팩트가 참조하는 소스마다 번호 붙은 인용 1개 생성.
 * source → fact → citation 사슬을 확정해 슬라이드/출처 슬라이드가 렌더할 수 있게 한다.
 * facts로 실제 참조된 소스만 인용화(미사용 소스는 각주에 안 나옴).
 */
export function buildCitations(sources: Source[], facts: Fact[]): BuiltCitations {
  const sourceById = new Map(sources.map((s) => [s.id, s]))
  const usedSourceIds: string[] = []
  for (const f of facts) {
    if (sourceById.has(f.sourceId) && !usedSourceIds.includes(f.sourceId)) {
      usedSourceIds.push(f.sourceId)
    }
  }

  const citations: Citation[] = []
  const sourceToCitation: Record<string, string> = {}
  usedSourceIds.forEach((sourceId, i) => {
    const src = sourceById.get(sourceId)!
    const id = `cite_${i + 1}`
    const citation: Citation = { id, sourceId, label: String(i + 1) }
    if (src.url) citation.url = src.url
    citations.push(citation)
    sourceToCitation[sourceId] = id
  })
  return { citations, sourceToCitation }
}

/** 특정 팩트 집합이 참조하는 인용 ID들(중복 제거) — 슬라이드 citationIds 구성용 */
export function citationIdsForFacts(
  facts: Fact[],
  sourceToCitation: Record<string, string>,
): string[] {
  const ids: string[] = []
  for (const f of facts) {
    const cid = sourceToCitation[f.sourceId]
    if (cid && !ids.includes(cid)) ids.push(cid)
  }
  return ids
}

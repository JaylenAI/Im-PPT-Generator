import { z } from 'zod'
import type { Fact, Source } from '@im-ppt/schema'
import type { StructuredLlm } from './types.js'

/** 소스 + 그 본문 텍스트(추출용, 비영속) */
export interface SourceDoc {
  source: Source
  text: string
}

/** LLM 출력 계약 — sourceRef는 [S1]의 1-based 인덱스, id는 우리가 부여 */
const factsDraftSchema = z.object({
  facts: z
    .array(
      z.object({
        sourceRef: z.number().int().min(1),
        kind: z.enum(['statistic', 'insight', 'quote', 'visual']),
        statement: z.string().min(1),
      }),
    )
    .default([]),
})

let factCounter = 0
function nextFactId(): string {
  factCounter += 1
  return `fact_${Date.now().toString(36)}_${factCounter}`
}

function docsToText(docs: SourceDoc[]): string {
  return docs
    .map((d, i) => {
      const src = d.source
      const head = `[S${i + 1}] ${src.title}${src.url ? ` (${src.url})` : ''}`
      return `${head}\n${d.text.slice(0, 6000)}`
    })
    .join('\n\n---\n\n')
}

/**
 * 소스에서 팩트 추출 — 모든 소스를 한 번에 LLM에 주고 팩트를 뽑는다.
 * 각 팩트는 sourceRef로 출처를 명시 → sourceId 부착(할루시네이션 제로: 근거 있는 문장만).
 * 알 수 없는 sourceRef는 버린다(지어낸 출처 방지). 팩트는 'pending'으로 시작(승인 게이트 대상).
 */
export async function extractFacts(
  docs: SourceDoc[],
  opts: {
    topic: string
    language: string
    llm: StructuredLlm
    buildFactPrompt: (args: { topic: string; sourcesText: string; language: string }) => string
  },
): Promise<Fact[]> {
  if (docs.length === 0) return []
  const prompt = opts.buildFactPrompt({
    topic: opts.topic,
    sourcesText: docsToText(docs),
    language: opts.language,
  })
  const { data } = await opts.llm(prompt, factsDraftSchema)

  const facts: Fact[] = []
  for (const raw of data.facts) {
    const doc = docs[raw.sourceRef - 1]
    if (!doc) continue // 지어낸 출처 참조 폐기
    facts.push({
      id: nextFactId(),
      sourceId: doc.source.id,
      kind: raw.kind,
      statement: raw.statement,
      status: 'pending',
    })
  }
  return facts
}

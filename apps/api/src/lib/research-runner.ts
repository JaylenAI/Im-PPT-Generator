import type { GenerationConfig, Source, UserSourceInput } from '@im-ppt/schema'
import { runResearch, type StructuredLlm } from '@im-ppt/research'
import type { ResearchInput } from '@im-ppt/core'
import type { AppDeps } from '../deps.js'

/**
 * config.researchMode에 따라 리서치 실행(소스 수집 + 팩트 추출).
 * 워커(스트리밍)와 동기 /decks 경로가 공유 — 두 경로 모두 인용을 갖도록.
 * off면 undefined(리서치 스킵).
 */
export async function runResearchForConfig(
  deps: AppDeps,
  config: GenerationConfig,
  userSources: UserSourceInput[],
  onSource?: (s: Source) => void | Promise<void>,
): Promise<ResearchInput | undefined> {
  if (config.researchMode === 'off') return undefined

  const llm: StructuredLlm = (prompt, schema) =>
    deps.registry
      .generateStructured('research', prompt, schema)
      .then((r) => (r.usage ? { data: r.data, usage: r.usage } : { data: r.data }))

  const result = await runResearch(
    { topic: config.prompt, researchMode: config.researchMode, userSources },
    {
      llm,
      buildFactPrompt: ({ topic, sourcesText, language }) =>
        deps.prompts.get('fact_extraction', { topic, sourcesText, language }),
      language: config.language,
      ...(deps.search ? { search: deps.search } : {}),
    },
  )
  if (onSource) for (const s of result.sources) await onSource(s)
  return result
}

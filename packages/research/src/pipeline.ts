import type { Fact, Source } from '@im-ppt/schema'
import { extractFacts, type SourceDoc } from './extract-facts.js'
import { fetchUrlText } from './fetch-url.js'
import type { ResearchDeps, ResearchInput, ResearchResult, UserSourceInput } from './types.js'

let sourceCounter = 0
function nextSourceId(): string {
  sourceCounter += 1
  return `src_${Date.now().toString(36)}_${sourceCounter}`
}

/** 사용자 제공 자료 → SourceDoc (url은 본문 fetch, text는 그대로) */
async function userDocs(
  inputs: UserSourceInput[],
  fetchImpl: typeof fetch | undefined,
): Promise<SourceDoc[]> {
  const docs: SourceDoc[] = []
  for (const input of inputs) {
    if (input.kind === 'user_text' && input.text) {
      const source: Source = { id: nextSourceId(), kind: 'user_text', title: input.title ?? '사용자 입력' }
      docs.push({ source, text: input.text })
    } else if (input.kind === 'user_url' && input.url) {
      try {
        const { title, text } = await fetchUrlText(input.url, fetchImpl ? { fetchImpl } : {})
        const source: Source = { id: nextSourceId(), kind: 'user_url', title: input.title ?? title, url: input.url }
        docs.push({ source, text })
      } catch {
        // 가져오기 실패한 URL은 스킵(부분 실패 허용)
      }
    }
  }
  return docs
}

/** 웹 검색 결과 → SourceDoc. deep은 상위 결과 본문까지 가져와 근거 강화 */
async function searchDocs(
  input: ResearchInput,
  deps: ResearchDeps,
): Promise<SourceDoc[]> {
  if (!deps.search) return []
  const results = await deps.search.search(input.topic, { maxResults: input.maxResults ?? 5 })
  const deep = input.researchMode === 'deep'
  const docs: SourceDoc[] = []
  for (const [i, r] of results.entries()) {
    const source: Source = { id: nextSourceId(), kind: 'web', title: r.title, url: r.url }
    let text = r.snippet
    if (deep && i < 3 && r.url) {
      try {
        text = (await fetchUrlText(r.url, deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {})).text || r.snippet
      } catch {
        // 폴백: 스니펫 사용
      }
    }
    docs.push({ source, text })
  }
  return docs
}

/**
 * 리서치 실행 — researchMode에 따라 소스 수집(유저 + 웹 검색) 후 팩트 추출.
 * off: 리서치 없음 / user_only: 유저 자료만 / web: 검색(스니펫) / deep: 검색+본문 크롤.
 * 팩트는 모두 소스ID 부착 + 'pending'(승인 게이트 대상).
 */
export async function runResearch(input: ResearchInput, deps: ResearchDeps): Promise<ResearchResult> {
  if (input.researchMode === 'off') return { sources: [], facts: [] }

  const docs: SourceDoc[] = [...(await userDocs(input.userSources ?? [], deps.fetchImpl))]
  if (input.researchMode === 'web' || input.researchMode === 'deep') {
    docs.push(...(await searchDocs(input, deps)))
  }

  if (docs.length === 0) return { sources: [], facts: [] }

  const facts: Fact[] = await extractFacts(docs, {
    topic: input.topic,
    language: deps.language,
    llm: deps.llm,
    buildFactPrompt: deps.buildFactPrompt,
  })
  return { sources: docs.map((d) => d.source), facts }
}

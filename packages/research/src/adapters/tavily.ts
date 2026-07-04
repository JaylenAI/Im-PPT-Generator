import type { SearchAdapter, SearchResult } from '../types.js'

/**
 * Tavily 검색 어댑터 — 기본 웹 검색. 키·fetch 주입(테스트 가능).
 * https://api.tavily.com/search
 */
export function createTavilyAdapter(opts: {
  apiKey: string
  fetchImpl?: typeof fetch
}): SearchAdapter {
  const fetchImpl = opts.fetchImpl ?? fetch
  return {
    name: 'tavily',
    async search(query, searchOpts): Promise<SearchResult[]> {
      const res = await fetchImpl('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          api_key: opts.apiKey,
          query,
          max_results: searchOpts?.maxResults ?? 5,
          search_depth: 'basic',
        }),
      })
      if (!res.ok) throw new Error(`Tavily HTTP ${res.status}`)
      const body = (await res.json()) as {
        results?: Array<{ title?: string; url?: string; content?: string }>
      }
      return (body.results ?? []).map((r) => ({
        title: r.title ?? r.url ?? '제목 없음',
        url: r.url ?? '',
        snippet: r.content ?? '',
      }))
    },
  }
}

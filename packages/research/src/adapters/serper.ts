import type { SearchAdapter, SearchResult } from '../types.js'

/**
 * Serper(google.serper.dev) 검색 어댑터 — Tavily 폴백. 키·fetch 주입.
 */
export function createSerperAdapter(opts: {
  apiKey: string
  fetchImpl?: typeof fetch
}): SearchAdapter {
  const fetchImpl = opts.fetchImpl ?? fetch
  return {
    name: 'serper',
    async search(query, searchOpts): Promise<SearchResult[]> {
      const res = await fetchImpl('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'X-API-KEY': opts.apiKey },
        body: JSON.stringify({ q: query, num: searchOpts?.maxResults ?? 5 }),
      })
      if (!res.ok) throw new Error(`Serper HTTP ${res.status}`)
      const body = (await res.json()) as {
        organic?: Array<{ title?: string; link?: string; snippet?: string }>
      }
      return (body.organic ?? []).map((r) => ({
        title: r.title ?? r.link ?? '제목 없음',
        url: r.link ?? '',
        snippet: r.snippet ?? '',
      }))
    },
  }
}

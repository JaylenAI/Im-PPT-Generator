import { describe, expect, it, vi } from 'vitest'
import { createTavilyAdapter, createSerperAdapter } from '../src/index.js'
import { htmlToText } from '../src/fetch-url.js'

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
}

describe('Tavily 어댑터', () => {
  it('결과를 공통 SearchResult로 매핑', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ results: [{ title: 'T', url: 'https://t.com', content: '내용' }] }),
    ) as unknown as typeof fetch
    const adapter = createTavilyAdapter({ apiKey: 'k', fetchImpl })
    const results = await adapter.search('쿼리', { maxResults: 3 })
    expect(results).toEqual([{ title: 'T', url: 'https://t.com', snippet: '내용' }])
    expect(fetchImpl).toHaveBeenCalledWith('https://api.tavily.com/search', expect.objectContaining({ method: 'POST' }))
  })

  it('HTTP 오류는 throw', async () => {
    const fetchImpl = vi.fn(async () => new Response('x', { status: 500 })) as unknown as typeof fetch
    await expect(createTavilyAdapter({ apiKey: 'k', fetchImpl }).search('q')).rejects.toThrow(/500/)
  })
})

describe('Serper 어댑터', () => {
  it('organic 결과를 매핑', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ organic: [{ title: 'S', link: 'https://s.com', snippet: '스니펫' }] }),
    ) as unknown as typeof fetch
    const results = await createSerperAdapter({ apiKey: 'k', fetchImpl }).search('q')
    expect(results).toEqual([{ title: 'S', url: 'https://s.com', snippet: '스니펫' }])
  })
})

describe('htmlToText', () => {
  it('스크립트/스타일 제거 + 태그 스트립', () => {
    const html = '<html><head><style>.a{}</style></head><body><h1>제목</h1><script>x()</script><p>본문 텍스트</p></body></html>'
    const text = htmlToText(html)
    expect(text).toContain('제목')
    expect(text).toContain('본문 텍스트')
    expect(text).not.toContain('x()')
    expect(text).not.toContain('.a{}')
  })

  it('엔티티 디코드', () => {
    expect(htmlToText('<p>A&amp;B &lt;3</p>')).toContain('A&B <3')
  })
})

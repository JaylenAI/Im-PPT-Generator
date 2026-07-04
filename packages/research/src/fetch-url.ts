/** URL 본문을 텍스트로 — 스크립트/스타일 제거 후 태그 스트립. Firecrawl 없이 기본 케이스 처리 */
export async function fetchUrlText(
  url: string,
  opts: { fetchImpl?: typeof fetch; maxChars?: number; timeoutMs?: number } = {},
): Promise<{ title: string; text: string }> {
  const fetchImpl = opts.fetchImpl ?? fetch
  const maxChars = opts.maxChars ?? 12000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15000)
  try {
    const res = await fetchImpl(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'im-ppt-research/0.1 (+https://github.com/JaylenAI)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()
    return { title: extractTitle(html) || url, text: htmlToText(html).slice(0, maxChars) }
  } finally {
    clearTimeout(timer)
  }
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return m ? decodeEntities(m[1]!.trim()) : ''
}

/** 태그 제거 + 공백 정규화(간단 스트리퍼 — 본문 텍스트 추출용) */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<\/(p|div|li|h[1-6]|br|section|article)>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
}

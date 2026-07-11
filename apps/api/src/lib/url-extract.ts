import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import type { BrandKit } from '@im-ppt/schema'

/**
 * 브랜드 사이트 URL → 브랜드킷(P12) — 페이지 HTML/동일출처 CSS에서 대표 색과 폰트를 추출.
 * theme-color 메타·CSS 브랜드 변수(--primary/--brand/--accent)를 강한 신호로 가중하고,
 * 나머지 색은 빈도로 집계해 채도·명도로 primary/accent/background/text를 분류한다.
 * SSRF 방어: 스킴·호스트·IP 대역을 사전 검증하고 리다이렉트를 수동으로 홉마다 재검증한다.
 */

const FETCH_TIMEOUT_MS = 8000
const MAX_BYTES = 2 * 1024 * 1024 // 2MB — 브랜드 신호는 상단 CSS에 몰림
const MAX_REDIRECTS = 4
const MAX_STYLESHEETS = 3 // 동일출처 외부 CSS 추가 수집(브랜드 색은 대개 여기 있음)

/** 사설/루프백/링크로컬/메타데이터 IP 차단 — SSRF 1차 방어 */
function isBlockedIp(ip: string): boolean {
  const v = isIP(ip)
  if (v === 4) {
    const p = ip.split('.').map(Number)
    if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true
    const [a, b] = p as [number, number, number, number]
    if (a === 10 || a === 127 || a === 0) return true // private / loopback / unspecified
    if (a === 172 && b >= 16 && b <= 31) return true // 172.16/12
    if (a === 192 && b === 168) return true // 192.168/16
    if (a === 169 && b === 254) return true // link-local(169.254.169.254 메타데이터 포함)
    if (a === 100 && b >= 64 && b <= 127) return true // CGNAT 100.64/10
    if (a >= 224) return true // multicast/reserved
    return false
  }
  // IPv6 — 루프백/ULA/링크로컬/미지정 + IPv4-mapped
  const lower = ip.toLowerCase()
  if (lower === '::1' || lower === '::') return true
  if (lower.startsWith('fe80') || lower.startsWith('fc') || lower.startsWith('fd')) return true
  const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return isBlockedIp(mapped[1]!)
  return false
}

/** URL이 공개 대상인지 검증 — 스킴·호스트·해석된 모든 IP 확인. 실패 시 throw */
async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('올바른 URL이 아닙니다')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('http/https URL만 지원합니다')
  }
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) {
    throw new Error('내부 호스트는 허용되지 않습니다')
  }
  // 호스트가 IP 리터럴이면 바로 검사, 아니면 DNS 해석 후 전 주소 검사
  if (isIP(host)) {
    if (isBlockedIp(host)) throw new Error('내부 IP는 허용되지 않습니다')
  } else {
    const addrs = await lookup(host, { all: true }).catch(() => {
      throw new Error('호스트를 해석할 수 없습니다')
    })
    if (addrs.length === 0 || addrs.some((a) => isBlockedIp(a.address))) {
      throw new Error('내부 IP로 해석되는 호스트는 허용되지 않습니다')
    }
  }
  return url
}

/** 리다이렉트를 수동 추적하며 홉마다 SSRF 재검증. 본문은 크기 상한으로 절단 */
async function safeFetchText(raw: string): Promise<{ finalUrl: URL; body: string }> {
  let current = await assertPublicUrl(raw)
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
    let res: Response
    try {
      res = await fetch(current, {
        redirect: 'manual',
        signal: ctrl.signal,
        headers: { 'user-agent': 'Im-PPT-BrandBot/1.0', accept: 'text/html,text/css,*/*' },
      })
    } finally {
      clearTimeout(timer)
    }
    // 3xx — Location을 재검증 후 다음 홉
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) throw new Error('리다이렉트 위치가 없습니다')
      current = await assertPublicUrl(new URL(loc, current).toString())
      continue
    }
    if (!res.ok) throw new Error(`페이지를 가져오지 못했습니다(HTTP ${res.status})`)
    const body = await readCapped(res)
    return { finalUrl: current, body }
  }
  throw new Error('리다이렉트가 너무 많습니다')
}

/** 응답 본문을 MAX_BYTES까지만 읽어 메모리 폭주 방지 */
async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader()
  if (!reader) return await res.text()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value)
      total += value.length
      if (total >= MAX_BYTES) {
        await reader.cancel().catch(() => {})
        break
      }
    }
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8')
}

// ── 색상 유틸 ──────────────────────────────────────────────
interface Rgb {
  r: number
  g: number
  b: number
}

function hexToRgb(hex: string): Rgb | null {
  let h = hex.replace('#', '')
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('')
  if (h.length !== 6 && h.length !== 8) return null
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return null
  return { r, g, b }
}

function toHex({ r, g, b }: Rgb): string {
  return '#' + [r, g, b].map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('')
}

/** 상대 휘도(0~1) — 명도 분류용 */
function luminance({ r, g, b }: Rgb): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

/** HSL 채도(0~1) — 무채색(회색) 걸러내기용 */
function saturation({ r, g, b }: Rgb): number {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  if (max === min) return 0
  const l = (max + min) / 2
  const d = max - min
  return l > 0.5 ? d / (2 - max - min) : d / (max + min)
}

/** 두 색의 유클리드 거리 — accent가 primary와 충분히 다른지 판정 */
function dist(a: Rgb, b: Rgb): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)
}

interface ColorHit {
  rgb: Rgb
  weight: number
}

/** 문서에서 hex·rgb() 색을 모두 뽑아 정규화된 hex→가중치 맵으로 집계 */
function collectColors(text: string, baseWeight: number, acc: Map<string, ColorHit>): void {
  const add = (rgb: Rgb, w: number) => {
    const key = toHex(rgb)
    const cur = acc.get(key)
    if (cur) cur.weight += w
    else acc.set(key, { rgb, weight: w })
  }
  for (const m of text.matchAll(/#([0-9a-fA-F]{3,8})\b/g)) {
    const rgb = hexToRgb('#' + m[1]!)
    if (rgb) add(rgb, baseWeight)
  }
  for (const m of text.matchAll(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g)) {
    add({ r: +m[1]!, g: +m[2]!, b: +m[3]! }, baseWeight)
  }
}

/** CSS 브랜드 변수(--primary/--brand/--accent 등) 값은 강한 신호로 가중 */
function collectBrandVars(text: string, acc: Map<string, ColorHit>): void {
  const re = /--[\w-]*(?:primary|brand|accent|main|theme|color-1|secondary)[\w-]*\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/gi
  for (const m of text.matchAll(re)) collectColors(m[1]!, 40, acc)
}

// ── 폰트 유틸 ──────────────────────────────────────────────
const GENERIC_FONTS = new Set([
  'sans-serif', 'serif', 'monospace', 'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace',
  'inherit', 'initial', 'cursive', 'fantasy', '-apple-system', 'blinkmacsystemfont',
])

function cleanFont(raw: string): string | undefined {
  const f = raw.replace(/['"]/g, '').trim()
  if (!f || GENERIC_FONTS.has(f.toLowerCase())) return undefined
  if (f.length > 40 || /[{}();]/.test(f)) return undefined
  return f
}

/** Google Fonts 링크와 font-family 선언에서 heading/body 후보 폰트 추출 */
function extractFonts(html: string): BrandKit['fonts'] | undefined {
  const ordered: string[] = []
  const push = (f?: string) => {
    if (f && !ordered.some((x) => x.toLowerCase() === f.toLowerCase())) ordered.push(f)
  }
  // Google Fonts: 링크의 family= 순서가 대개 heading→body
  for (const m of html.matchAll(/fonts\.googleapis\.com\/css2?\?([^"'&\s>]+(?:&[^"'\s>]+)*)/g)) {
    for (const fam of m[1]!.matchAll(/family=([^&:]+)/g)) {
      push(cleanFont(decodeURIComponent(fam[1]!.replace(/\+/g, ' '))))
    }
  }
  // font-family 선언 — 첫 번째 명명 폰트만
  for (const m of html.matchAll(/font-family\s*:\s*([^;}"']+)/gi)) {
    const first = m[1]!.split(',')[0]
    push(cleanFont(first ?? ''))
    if (ordered.length >= 4) break
  }
  if (ordered.length === 0) return undefined
  const heading = ordered[0]!
  const body = ordered[1] ?? ordered[0]!
  return { heading, body }
}

/** <link rel=stylesheet>의 동일출처 href를 최대 N개 수집(브랜드 색 보강용) */
function sameOriginStylesheets(html: string, base: URL): string[] {
  const out: string[] = []
  for (const m of html.matchAll(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi)) {
    const href = m[0].match(/href=["']([^"']+)["']/i)?.[1]
    if (!href) continue
    try {
      const u = new URL(href, base)
      if (u.hostname === base.hostname && (u.protocol === 'http:' || u.protocol === 'https:')) {
        out.push(u.toString())
      }
    } catch {
      /* skip malformed */
    }
    if (out.length >= MAX_STYLESHEETS) break
  }
  return out
}

/** theme-color 메타 — 브랜드 primary의 가장 강한 단일 신호 */
function themeColorMeta(html: string): Rgb | null {
  const m = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']theme-color["']/i)
  if (!m) return null
  const v = m[1]!.trim()
  if (v.startsWith('#')) return hexToRgb(v)
  const rgb = v.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/)
  return rgb ? { r: +rgb[1]!, g: +rgb[2]!, b: +rgb[3]! } : null
}

/**
 * 순수 분석 — 네트워크 없이 HTML(+선택적 동일출처 CSS 문서들)에서 브랜드킷 도출.
 * 네트워크 계층(safeFetchText)과 분리해 단위 테스트/재사용 가능하게 한다.
 */
export function extractBrandKitFromHtml(html: string, extraCss: readonly string[] = []): BrandKit {
  const colors = new Map<string, ColorHit>()
  collectBrandVars(html, colors)
  collectColors(html, 1, colors)
  for (const css of extraCss) {
    collectBrandVars(css, colors)
    collectColors(css, 1, colors)
  }

  // theme-color는 primary 최우선 신호
  const themeColor = themeColorMeta(html)
  if (themeColor) {
    const key = toHex(themeColor)
    const cur = colors.get(key)
    if (cur) cur.weight += 100
    else colors.set(key, { rgb: themeColor, weight: 100 })
  }

  if (colors.size === 0) throw new Error('페이지에서 색상을 찾지 못했습니다')

  const hits = [...colors.values()]
  // 브랜드 후보: 유채색 + 극단 명도 아님(배경/텍스트 제외).
  // theme-color는 +100 가중을 이미 받으므로 유채색이면 자연히 1위가 됨(near-white theme-color 오인 방지).
  const brandCandidates = hits
    .filter((h) => saturation(h.rgb) >= 0.18 && luminance(h.rgb) > 0.12 && luminance(h.rgb) < 0.9)
    .sort((a, b) => b.weight - a.weight)

  const kitColors: NonNullable<BrandKit['colors']> = {}
  const primary = brandCandidates[0]?.rgb
  if (primary) kitColors.primary = toHex(primary)

  // accent — primary와 충분히 다른(거리>60) 다음 유채색
  const accent = brandCandidates.find((h) => !primary || dist(h.rgb, primary) > 60)?.rgb
  if (accent && toHex(accent) !== kitColors.primary) kitColors.accent = toHex(accent)

  // secondary — 어두운 유채색(브랜드 짙은 톤) 있으면
  const secondary = hits
    .filter((h) => saturation(h.rgb) >= 0.15 && luminance(h.rgb) <= 0.35)
    .sort((a, b) => b.weight - a.weight)[0]?.rgb
  if (secondary && toHex(secondary) !== kitColors.primary) kitColors.secondary = toHex(secondary)

  // background — 가장 흔한 밝은색(near-white), textPrimary — 가장 흔한 어두운색
  const bg = hits.filter((h) => luminance(h.rgb) >= 0.9).sort((a, b) => b.weight - a.weight)[0]?.rgb
  if (bg) kitColors.background = toHex(bg)
  const text = hits.filter((h) => luminance(h.rgb) <= 0.2).sort((a, b) => b.weight - a.weight)[0]?.rgb
  if (text) kitColors.textPrimary = toHex(text)

  if (Object.keys(kitColors).length === 0) throw new Error('브랜드 색을 분류하지 못했습니다')

  // 폰트는 자체호스팅 시 CSS 번들에 있으므로 html + 동일출처 CSS 전체를 스캔
  const fonts = extractFonts([html, ...extraCss].join('\n'))
  return { colors: kitColors, ...(fonts ? { fonts } : {}) }
}

/**
 * 브랜드 사이트 URL → 브랜드킷. HTML과 동일출처 CSS를 SSRF-안전하게 가져와 분석한다.
 */
export async function extractUrlBrandKit(rawUrl: string): Promise<BrandKit> {
  const { finalUrl, body: html } = await safeFetchText(rawUrl)

  // 동일출처 CSS 보강 — best-effort, 실패는 무시
  const cssDocs: string[] = []
  for (const href of sameOriginStylesheets(html, finalUrl)) {
    try {
      const { body: css } = await safeFetchText(href)
      cssDocs.push(css)
    } catch {
      /* 스타일시트 하나 실패해도 계속 */
    }
  }

  return extractBrandKitFromHtml(html, cssDocs)
}

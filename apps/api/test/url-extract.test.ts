import { describe, expect, it } from 'vitest'
import { customTemplateSchema } from '@im-ppt/schema'
import { extractBrandKitFromHtml, extractUrlBrandKit } from '../src/lib/url-extract.js'
import { buildCustomTemplate } from '../src/lib/custom-template.js'

const BRAND_HTML = `<!doctype html><html><head>
<meta name="theme-color" content="#1a73e8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@600&family=Inter:wght@400&display=swap">
<style>
:root { --brand-primary: #1a73e8; --accent-color: #ff6d00; }
body { background: #ffffff; color: #202124; font-family: 'Inter', system-ui, sans-serif; }
h1, h2 { font-family: 'Poppins', sans-serif; color: #1a73e8; }
.cta { background: #ff6d00; color: #fff; }
.footer { background: #0b1f3a; }
</style></head><body><h1>Brand</h1></body></html>`

describe('extractBrandKitFromHtml — 순수 추출', () => {
  it('theme-color/CSS 변수/폰트에서 브랜드킷을 도출한다', () => {
    const kit = extractBrandKitFromHtml(BRAND_HTML)
    expect(kit.colors?.primary).toBe('#1a73e8') // theme-color 최우선
    expect(kit.colors?.accent).toBe('#ff6d00') // primary와 충분히 다른 유채색
    expect(kit.colors?.background).toBe('#ffffff') // 가장 밝은색
    expect(kit.colors?.textPrimary).toBe('#202124') // 가장 어두운색
    expect(kit.fonts?.heading).toBe('Poppins') // google fonts 첫 family
    expect(kit.fonts?.body).toBe('Inter') // 두 번째 family
  })

  it('rgb() 표기와 3자리 hex도 인식한다', () => {
    const html = `<style>.a{color:rgb(220,20,60)}.b{background:#fff}.c{color:#111}</style>`
    const kit = extractBrandKitFromHtml(html)
    expect(kit.colors?.primary).toBe('#dc143c') // crimson
    expect(kit.colors?.background).toBe('#ffffff')
  })

  it('색이 하나도 없으면 실패시킨다', () => {
    expect(() => extractBrandKitFromHtml('<p>텍스트만</p>')).toThrow()
  })

  it('추출 결과가 유효한 커스텀 템플릿으로 조립된다', () => {
    const kit = extractBrandKitFromHtml(BRAND_HTML)
    const tpl = buildCustomTemplate('구글', kit, 'ws-1', { source: 'imported_url', sourceRef: 'https://google.com' })
    const parsed = customTemplateSchema.parse(tpl)
    expect(parsed.source).toBe('imported_url')
    expect(parsed.sourceFileRef).toBe('https://google.com')
    expect(parsed.themeTokens.colors.primary).toBe('#1a73e8')
    expect(parsed.themeTokens.colors.accent).toBe('#ff6d00')
  })
})

describe('extractUrlBrandKit — SSRF 방어', () => {
  const blocked = [
    'http://localhost/',
    'http://127.0.0.1/',
    'http://192.168.1.1/',
    'http://10.0.0.5/',
    'http://169.254.169.254/latest/meta-data/', // 클라우드 메타데이터
    'http://[::1]/',
    'https://foo.internal/',
    'ftp://example.com/',
    'file:///etc/passwd',
    'not-a-url',
  ]
  for (const url of blocked) {
    it(`차단: ${url}`, async () => {
      await expect(extractUrlBrandKit(url)).rejects.toThrow()
    })
  }
})

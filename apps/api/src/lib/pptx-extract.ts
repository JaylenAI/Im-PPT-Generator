import JSZip from 'jszip'
import type { BrandKit } from '@im-ppt/schema'

/** clrScheme의 특정 색상 이름(dk1/lt1/accent1 등)에서 hex 추출(srgbClr 또는 sysClr lastClr) */
function pickColor(xml: string, name: string): string | undefined {
  const block = xml.match(new RegExp(`<a:${name}>([\\s\\S]*?)</a:${name}>`))
  if (!block) return undefined
  const srgb = block[1]!.match(/<a:srgbClr val="([0-9A-Fa-f]{6})"/)
  if (srgb) return `#${srgb[1]!.toLowerCase()}`
  const sys = block[1]!.match(/lastClr="([0-9A-Fa-f]{6})"/)
  if (sys) return `#${sys[1]!.toLowerCase()}`
  return undefined
}

/**
 * 업로드 PPTX → 브랜드킷(P6) — 테마 XML의 clrScheme를 브랜드 색상으로 매핑.
 * accent1→primary, accent2→accent, dk2→secondary, lt1→background, dk1→textPrimary.
 * python-pptx/PowerPoint 표준 theme1.xml 구조 기준.
 */
export async function extractPptxBrandKit(buffer: Buffer): Promise<BrandKit> {
  const zip = await JSZip.loadAsync(buffer)
  const themePath = Object.keys(zip.files).find((p) => /^ppt\/theme\/theme\d+\.xml$/.test(p))
  if (!themePath) throw new Error('PPTX 테마를 찾을 수 없습니다')
  const xml = await zip.files[themePath]!.async('text')

  const colors: NonNullable<BrandKit['colors']> = {}
  const map: Array<[string, keyof NonNullable<BrandKit['colors']>]> = [
    ['accent1', 'primary'],
    ['accent2', 'accent'],
    ['dk2', 'secondary'],
    ['lt1', 'background'],
    ['dk1', 'textPrimary'],
  ]
  for (const [schemeName, brandKey] of map) {
    const hex = pickColor(xml, schemeName)
    if (hex) colors[brandKey] = hex
  }
  if (Object.keys(colors).length === 0) throw new Error('테마에서 색상을 추출하지 못했습니다')
  return { colors }
}

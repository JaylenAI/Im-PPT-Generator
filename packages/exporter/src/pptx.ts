import PptxGenJS from 'pptxgenjs'
import type { Deck, SlideBackground, ThemeTokens } from '@im-ppt/schema'
import { CANVAS_SIZES } from '@im-ppt/schema'
import { pxToInch, resolveColor } from './units.js'
import { addElement } from './elements.js'

export interface ExportOptions {
  /** 슬라이드 노트 포함 여부 */
  includeNotes?: boolean
}

function applyBackground(slide: PptxGenJS.Slide, bg: SlideBackground, tokens: ThemeTokens): void {
  if (bg.kind === 'color') {
    slide.background = { color: resolveColor(bg.color, tokens) }
  } else if (bg.kind === 'gradient') {
    // PptxGenJS 배경 그라디언트 미지원 → from 색으로 근사(무성 실패 아님, 문서화된 한계)
    slide.background = { color: resolveColor(bg.from, tokens) }
  } else if (bg.kind === 'image') {
    const isData = bg.src.startsWith('data:')
    slide.background = isData ? { data: bg.src } : { path: bg.src }
  }
}

/**
 * 덱 JSON → 편집 가능한 PPTX(Buffer). 절대좌표 요소를 PptxGenJS 네이티브로 매핑(ADR-001).
 * themeTokens는 호출자가 resolve해서 주입(exporter는 테마 저장 위치에 비종속 — ADR-007).
 */
export async function exportDeckToPptx(
  deck: Deck,
  themeTokens: ThemeTokens,
  opts: ExportOptions = {},
): Promise<Buffer> {
  const pptx = new PptxGenJS()
  const canvas = CANVAS_SIZES[deck.aspectRatio]
  pptx.defineLayout({ name: 'CANVAS', width: pxToInch(canvas.width), height: pxToInch(canvas.height) })
  pptx.layout = 'CANVAS'
  pptx.author = 'Im PPT Generator'
  pptx.title = deck.title

  for (const slide of deck.slides) {
    const s = pptx.addSlide()
    if (slide.background) applyBackground(s, slide.background, themeTokens)
    else s.background = { color: resolveColor('token:colors.background', themeTokens) }
    for (const el of slide.elements) addElement(pptx, s, el, themeTokens)
    if (opts.includeNotes && slide.notes) s.addNotes(slide.notes)
  }

  const out = await pptx.write({ outputType: 'nodebuffer' })
  return out as Buffer
}

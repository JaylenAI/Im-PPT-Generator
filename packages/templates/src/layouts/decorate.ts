import type { SlideElement, ThemeStyle } from '@im-ppt/schema'
import type { LayoutResult } from './types.js'

/**
 * 디자인 시스템 후처리(P11) — 레이아웃 build 결과에 시스템별 "골격 장식"을 입힌다.
 * defineLayout이 모든 레이아웃에 일괄 적용하므로 16개 레이아웃 코드를 건드리지 않고
 * 색/폰트를 넘어선 시각적 차별화(대문자 헤딩·타이틀 액센트·배경 그리드/룰/워터마크·헤어라인·radius)를 만든다.
 * style이 없으면 결과를 그대로 반환(하위호환).
 */

const base = { rotation: 0, opacity: 1, locked: false } as const

function rect(
  id: string,
  frame: { x: number; y: number; w: number; h: number },
  fill: string,
  opts: { radius?: number; opacity?: number; stroke?: { color: string; width: number } } = {},
): SlideElement {
  return {
    ...base,
    id,
    type: 'shape',
    shape: 'rect',
    frame,
    fill,
    opacity: opts.opacity ?? 1,
    ...(opts.radius !== undefined ? { cornerRadius: opts.radius } : {}),
    ...(opts.stroke ? { stroke: opts.stroke } : {}),
  }
}

function ellipse(id: string, frame: { x: number; y: number; w: number; h: number }, fill: string, opacity: number): SlideElement {
  return { ...base, id, type: 'shape', shape: 'ellipse', frame, fill, opacity }
}

const HAIRLINE = 'token:colors.secondary'
const ACCENT = 'token:colors.accent'

/** 배경 장식 요소(가장 뒤에 깔림) */
function backgroundDecor(style: ThemeStyle, W: number, H: number): SlideElement[] {
  switch (style.background) {
    case 'grid': {
      const els: SlideElement[] = []
      for (let i = 1; i * 160 < W; i++) els.push(rect(`ds-gridv-${i}`, { x: i * 160, y: 0, w: 1, h: H }, HAIRLINE, { opacity: 0.06 }))
      for (let j = 1; j * 120 < H; j++) els.push(rect(`ds-gridh-${j}`, { x: 0, y: j * 120, w: W, h: 1 }, HAIRLINE, { opacity: 0.06 }))
      return els
    }
    case 'ruled': {
      const els: SlideElement[] = []
      for (let j = 1; 150 + j * 96 < H - 40; j++) els.push(rect(`ds-rule-${j}`, { x: 80, y: 150 + j * 96, w: W - 160, h: 1 }, HAIRLINE, { opacity: 0.09 }))
      return els
    }
    case 'watermark':
      return [ellipse('ds-watermark', { x: W - 300, y: -160, w: 520, h: 520 }, ACCENT, 0.05)]
    default:
      return []
  }
}

/** display/title 텍스트 요소를 찾아 인덱스 반환(없으면 -1) */
function findTitleIndex(els: SlideElement[]): number {
  const display = els.findIndex((e) => e.type === 'text' && e.role === 'display')
  if (display >= 0) return display
  return els.findIndex((e) => e.type === 'text' && e.role === 'title')
}

/** 큰 rect 표면인지(카드/코드블록 처리 대상) — 얇은 액센트 바나 풀블리드 배경은 제외 */
function isSurface(el: SlideElement): boolean {
  if (el.type !== 'shape' || el.shape !== 'rect') return false
  const { w, h } = el.frame
  if (w > 1100 && h > 600) return false // 풀블리드 배경
  return w >= 280 && h >= 110
}

export function applyDesignSystem(result: LayoutResult, style: ThemeStyle | undefined, canvas: { width: number; height: number }): LayoutResult {
  if (!style) return result
  const W = canvas.width
  const H = canvas.height
  const titleIdx = findTitleIndex(result.elements)
  const titleEl = titleIdx >= 0 ? result.elements[titleIdx] : undefined

  const borderWidth = style.border === 'bold' ? 3 : style.border === 'hairline' ? 1 : 0

  // 1) 기존 요소 변환(대문자 헤딩, 표면 radius/보더) + block 액센트는 타이틀 앞에 삽입
  const body: SlideElement[] = []
  result.elements.forEach((el, i) => {
    let out = el
    // 헤딩 대문자화
    if (style.headingCase === 'upper' && out.type === 'text' && (out.role === 'display' || out.role === 'title')) {
      out = { ...out, content: out.content.toUpperCase() }
    }
    // 표면 radius/보더
    if (isSurface(out) && out.type === 'shape') {
      out = {
        ...out,
        cornerRadius: style.radius,
        ...(borderWidth > 0 ? { stroke: { color: HAIRLINE, width: borderWidth } } : {}),
      }
    }
    // block 타이틀 액센트: 타이틀(display) 뒤 배경 블록 + 텍스트색 반전
    if (i === titleIdx && style.titleAccent === 'block' && out.type === 'text' && out.role === 'display') {
      const f = out.frame
      body.push(rect('ds-title-block', { x: f.x - 16, y: f.y - 8, w: Math.min(f.w, 760) + 32, h: f.h + 16 }, ACCENT, { radius: style.radius }))
      out = { ...out, style: { ...out.style, color: 'token:colors.background' } }
    }
    body.push(out)
  })

  // 2) 타이틀 액센트(sidebar/underline) + kicker — 콘텐츠 위에 얹음
  const overlay: SlideElement[] = []
  if (style.titleAccent === 'sidebar') {
    overlay.push(rect('ds-sidebar', { x: 0, y: 0, w: 14, h: H }, ACCENT, {}))
  }
  if (style.titleAccent === 'underline' && titleEl) {
    const f = titleEl.frame
    overlay.push(rect('ds-underline', { x: f.x, y: f.y + f.h + 4, w: Math.min(f.w * 0.5, 300), h: borderWidth === 3 ? 4 : 3 }, ACCENT, {}))
  }
  if (style.kicker === 'rule' || style.kicker === 'mono') {
    overlay.push(rect('ds-kicker', { x: 80, y: 46, w: 44, h: 4 }, ACCENT, { radius: 2 }))
  }

  const background =
    style.background === 'gradient' && (!result.background || result.background.kind === 'color')
      ? ({ kind: 'gradient', from: 'token:colors.background', to: 'token:colors.surface', angle: 135 } as const)
      : result.background

  return {
    ...(background ? { background } : {}),
    elements: [...backgroundDecor(style, W, H), ...body, ...overlay],
  }
}

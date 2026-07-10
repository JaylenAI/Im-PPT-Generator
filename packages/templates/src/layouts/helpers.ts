import type { Frame, SlideElement } from '@im-ppt/schema'

type TextRole = 'display' | 'title' | 'subtitle' | 'body' | 'caption'
type TextStyle = Extract<SlideElement, { type: 'text' }>['style']

const baseDefaults = { rotation: 0, opacity: 1, locked: false } as const

export function text(
  id: string,
  role: TextRole,
  content: string,
  frame: Frame,
  style: TextStyle = {},
): SlideElement {
  return { ...baseDefaults, id, type: 'text', role, content, frame, style }
}

export function bulletList(
  id: string,
  items: string[],
  frame: Frame,
  marker: 'dot' | 'dash' | 'number' | 'check' = 'dot',
  style: TextStyle = {},
): SlideElement {
  return { ...baseDefaults, id, type: 'list', items, marker, frame, style }
}

export function rect(
  id: string,
  frame: Frame,
  fill: string,
  cornerRadius?: number,
): SlideElement {
  return {
    ...baseDefaults,
    id,
    type: 'shape',
    shape: 'rect',
    frame,
    fill,
    ...(cornerRadius !== undefined ? { cornerRadius } : {}),
  }
}

export function line(id: string, frame: Frame, color: string, width: number): SlideElement {
  return { ...baseDefaults, id, type: 'shape', shape: 'line', frame, stroke: { color, width } }
}

export function ellipse(id: string, frame: Frame, fill: string, opacity = 1): SlideElement {
  return { ...baseDefaults, id, type: 'shape', shape: 'ellipse', frame, fill, opacity }
}

/** 이미지 요소 — 실 src(data URI/URL)가 있을 때만 사용. 없으면 레이아웃이 도형 플레이스홀더로 대체 */
export function image(
  id: string,
  src: string,
  frame: Frame,
  opts: { fit?: 'cover' | 'contain' | 'fill'; alt?: string; cornerRadius?: number } = {},
): SlideElement {
  return {
    ...baseDefaults,
    id,
    type: 'image',
    src,
    frame,
    fit: opts.fit ?? 'cover',
    alt: opts.alt ?? '',
    ...(opts.cornerRadius !== undefined ? { cornerRadius: opts.cornerRadius } : {}),
  }
}

/** 아이콘 요소 — name은 아이콘 세트(material symbols) 키. 렌더러/익스포터 공용 매핑 */
export function icon(id: string, name: string, frame: Frame, color?: string): SlideElement {
  return { ...baseDefaults, id, type: 'icon', name, frame, ...(color ? { color } : {}) }
}

/** 가로 공간을 n등분한 프레임 배열 (카드 그리드용) */
export function splitColumns(area: Frame, n: number, gap: number): Frame[] {
  const w = (area.w - gap * (n - 1)) / n
  return Array.from({ length: n }, (_, i) => ({
    x: area.x + i * (w + gap),
    y: area.y,
    w,
    h: area.h,
  }))
}

/** 표준 여백 — 전 레이아웃 공통 그리드 */
export const MARGIN = 80
export const CONTENT_W = 1280 - MARGIN * 2

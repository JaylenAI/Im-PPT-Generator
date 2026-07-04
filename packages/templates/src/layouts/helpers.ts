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

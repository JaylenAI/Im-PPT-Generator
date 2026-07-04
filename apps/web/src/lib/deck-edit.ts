import type { Deck, Frame } from '@im-ppt/schema'

type Element = Deck['slides'][number]['elements'][number]

/** 슬라이드 요소를 불변 갱신 — 항상 새 객체 생성(뮤테이션 금지) */
function mapSlideElements(deck: Deck, slideId: string, fn: (el: Element) => Element): Deck {
  return {
    ...deck,
    slides: deck.slides.map((s) =>
      s.id !== slideId ? s : { ...s, elements: s.elements.map(fn) },
    ),
  }
}

/** 요소 프레임(위치/크기) 부분 갱신 */
export function updateFrame(deck: Deck, slideId: string, elId: string, patch: Partial<Frame>): Deck {
  return mapSlideElements(deck, slideId, (el) =>
    el.id === elId ? { ...el, frame: { ...el.frame, ...patch } } : el,
  )
}

/** 텍스트 요소 스타일 부분 갱신(색상/폰트크기 등) */
export function updateTextStyle(
  deck: Deck,
  slideId: string,
  elId: string,
  patch: Partial<Extract<Element, { type: 'text' }>['style']>,
): Deck {
  return mapSlideElements(deck, slideId, (el) =>
    el.id === elId && el.type === 'text' ? { ...el, style: { ...el.style, ...patch } } : el,
  )
}

/** 요소 삭제 */
export function deleteElement(deck: Deck, slideId: string, elId: string): Deck {
  return {
    ...deck,
    slides: deck.slides.map((s) =>
      s.id !== slideId ? s : { ...s, elements: s.elements.filter((e) => e.id !== elId) },
    ),
  }
}

const rand = () => Math.random().toString(36).slice(2, 8)
const baseEl = { rotation: 0, opacity: 1, locked: false } as const

/** 새 요소 생성(P5 요소 추가 툴바) — 텍스트/이미지/도형 */
export function newElement(kind: 'text' | 'image' | 'shape', opts: { src?: string } = {}): Element {
  const frame = { x: 480, y: 300, w: 320, h: 120 }
  if (kind === 'text') {
    return { ...baseEl, id: `text_${rand()}`, type: 'text', role: 'body', content: '새 텍스트', frame, style: {} }
  }
  if (kind === 'image') {
    return { ...baseEl, id: `img_${rand()}`, type: 'image', src: opts.src ?? '', fit: 'cover', alt: '', frame: { x: 440, y: 240, w: 400, h: 240 } }
  }
  return { ...baseEl, id: `shape_${rand()}`, type: 'shape', shape: 'rect', fill: 'token:colors.primary', cornerRadius: 8, frame: { x: 500, y: 320, w: 280, h: 100 } }
}

/** 슬라이드에 요소 추가 */
export function addElement(deck: Deck, slideId: string, el: Element): Deck {
  return {
    ...deck,
    slides: deck.slides.map((s) => (s.id !== slideId ? s : { ...s, elements: [...s.elements, el] })),
  }
}

/** z-order 변경 — 요소를 앞(뒤 렌더=위)/뒤로 이동. 배열 순서가 z-order(뒤일수록 앞) */
export function reorderElement(deck: Deck, slideId: string, elId: string, dir: 'forward' | 'backward'): Deck {
  return {
    ...deck,
    slides: deck.slides.map((s) => {
      if (s.id !== slideId) return s
      const i = s.elements.findIndex((e) => e.id === elId)
      const j = dir === 'forward' ? i + 1 : i - 1
      if (i < 0 || j < 0 || j >= s.elements.length) return s
      const els = [...s.elements]
      ;[els[i], els[j]] = [els[j]!, els[i]!]
      return { ...s, elements: els }
    }),
  }
}

/** 텍스트 요소의 내용 변경 */
export function editText(deck: Deck, slideId: string, elId: string, content: string): Deck {
  return mapSlideElements(deck, slideId, (el) =>
    el.id === elId && el.type === 'text' ? { ...el, content } : el,
  )
}

/** 리스트 요소의 특정 항목 변경(빈 문자열이면 그 항목 제거) */
export function editListItem(
  deck: Deck,
  slideId: string,
  elId: string,
  index: number,
  text: string,
): Deck {
  return mapSlideElements(deck, slideId, (el) => {
    if (el.id !== elId || el.type !== 'list') return el
    const trimmed = text.trim()
    if (trimmed.length === 0) {
      // 빈 편집: 항목 2개 이상이면 제거, 1개뿐이면 기존 유지(스키마 min(1) 보호)
      return { ...el, items: el.items.length > 1 ? el.items.filter((_, i) => i !== index) : el.items }
    }
    return { ...el, items: el.items.map((it, i) => (i === index ? trimmed : it)) }
  })
}

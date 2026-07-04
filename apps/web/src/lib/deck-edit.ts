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

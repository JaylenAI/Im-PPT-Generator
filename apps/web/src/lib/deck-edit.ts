import type { Deck } from '@im-ppt/schema'

/** 슬라이드 요소를 불변 갱신 — 항상 새 객체 생성(뮤테이션 금지) */
function mapSlideElements(
  deck: Deck,
  slideId: string,
  fn: (el: Deck['slides'][number]['elements'][number]) => Deck['slides'][number]['elements'][number],
): Deck {
  return {
    ...deck,
    slides: deck.slides.map((s) =>
      s.id !== slideId ? s : { ...s, elements: s.elements.map(fn) },
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

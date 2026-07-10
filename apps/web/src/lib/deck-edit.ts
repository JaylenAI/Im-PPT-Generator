import type { Deck, Frame } from '@im-ppt/schema'
import { CANVAS_SIZES } from '@im-ppt/schema'

type Element = Deck['slides'][number]['elements'][number]
type Slide = Deck['slides'][number]

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

// ── 슬라이드 단위 관리(P12 Phase 2) — 전부 불변, commit()으로 undo 추적 ──

/** 요소 id를 전부 새로 부여 — 복제 시 슬라이드 간 id 충돌/선택 오류 방지 */
function reidElements(elements: Slide['elements']): Slide['elements'] {
  return elements.map((el) => ({ ...el, id: `${el.type}_${rand()}` }))
}

/** 슬라이드 복제 — 지정 인덱스 슬라이드를 새 id로 바로 뒤에 삽입 */
export function duplicateSlide(deck: Deck, index: number): Deck {
  const src = deck.slides[index]
  if (!src) return deck
  const copy: Slide = { ...src, id: `slide_${rand()}`, elements: reidElements(src.elements) }
  return { ...deck, slides: [...deck.slides.slice(0, index + 1), copy, ...deck.slides.slice(index + 1)] }
}

/** 슬라이드 삭제 — 최소 1장은 유지(빈 덱 방지) */
export function deleteSlide(deck: Deck, index: number): Deck {
  if (deck.slides.length <= 1 || index < 0 || index >= deck.slides.length) return deck
  return { ...deck, slides: deck.slides.filter((_, i) => i !== index) }
}

/** 슬라이드 순서 이동 — 이웃과 교환 */
export function moveSlide(deck: Deck, index: number, dir: 'left' | 'right'): Deck {
  const j = dir === 'left' ? index - 1 : index + 1
  if (index < 0 || index >= deck.slides.length || j < 0 || j >= deck.slides.length) return deck
  const slides = [...deck.slides]
  ;[slides[index], slides[j]] = [slides[j]!, slides[index]!]
  return { ...deck, slides }
}

/** 빈 슬라이드 — 덱 비율에 맞춰 중앙 제목/본문 플레이스홀더(비율별 좌표 자동 계산) */
function blankSlide(aspectRatio: Deck['aspectRatio']): Slide {
  const c = CANVAS_SIZES[aspectRatio]
  const m = Math.round(c.width * 0.0625)
  const w = c.width - m * 2
  return {
    id: `slide_${rand()}`,
    layoutType: 'bullets',
    elements: [
      { ...baseEl, id: `text_${rand()}`, type: 'text', role: 'title', content: '새 슬라이드', frame: { x: m, y: Math.round(c.height * 0.12), w, h: Math.round(c.height * 0.16) }, style: { color: 'token:colors.textPrimary', fontWeight: 'bold' } },
      { ...baseEl, id: `text_${rand()}`, type: 'text', role: 'body', content: '내용을 입력하세요', frame: { x: m, y: Math.round(c.height * 0.34), w, h: Math.round(c.height * 0.4) }, style: { color: 'token:colors.textSecondary' } },
    ],
    notes: '',
    citationIds: [],
    status: 'draft',
  }
}

/** 빈 슬라이드 추가 — 지정 인덱스 바로 뒤에 삽입 */
export function addSlide(deck: Deck, afterIndex: number): Deck {
  const at = Math.max(-1, Math.min(afterIndex, deck.slides.length - 1)) + 1
  return { ...deck, slides: [...deck.slides.slice(0, at), blankSlide(deck.aspectRatio), ...deck.slides.slice(at)] }
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

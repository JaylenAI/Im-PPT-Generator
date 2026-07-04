import { useEffect, useMemo, useRef, useState } from 'react'
import type { Deck, Theme } from '@im-ppt/schema'
import { SlideView, ScaledSlide } from '@im-ppt/renderer'
import { useAppStore } from '@/lib/store'

/** 덱 슬라이드를 썸네일로 — 우리 renderer 사용(의미형 SlideView 대체) */
export function SlideThumbnail({ deck, index = 0 }: { deck: Deck; index?: number }) {
  // themeFor를 셀렉터로 직접 호출하면 themeOverride 덱에서 매 렌더 새 객체 → 무한 리렌더.
  // themes 배열(안정)만 구독하고 테마는 useMemo로 안정 계산.
  const themes = useAppStore((s) => s.themes)
  const theme = useMemo<Theme | undefined>(
    () =>
      deck.themeOverride
        ? { id: `${deck.themeId}-brand`, name: 'Brand', tokens: deck.themeOverride }
        : themes.find((t) => t.id === deck.themeId),
    [themes, deck.themeId, deck.themeOverride],
  )
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  const slide = deck.slides[index] ?? deck.slides[0]

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => e && setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={ref} className="h-full w-full">
      {theme && slide && w > 0 && (
        <ScaledSlide width={w} aspectRatio={deck.aspectRatio}>
          <SlideView slide={slide} theme={theme} aspectRatio={deck.aspectRatio} />
        </ScaledSlide>
      )}
    </div>
  )
}

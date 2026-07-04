import { useEffect, useRef, useState } from 'react'
import type { Deck } from '@im-ppt/schema'
import { SlideView, ScaledSlide } from '@im-ppt/renderer'
import { useAppStore } from '@/lib/store'

/** 덱 슬라이드를 썸네일로 — 우리 renderer 사용(의미형 SlideView 대체) */
export function SlideThumbnail({ deck, index = 0 }: { deck: Deck; index?: number }) {
  const theme = useAppStore((s) => s.themeFor(deck))
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

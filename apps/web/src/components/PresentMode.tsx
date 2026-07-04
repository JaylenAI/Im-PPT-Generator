import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight, StickyNote } from 'lucide-react'
import type { Deck, Theme } from '@im-ppt/schema'
import { SlideView, ScaledSlide } from '@im-ppt/renderer'

const ASPECT: Record<string, number> = { '16:9': 16 / 9, '4:3': 4 / 3, '9:16': 9 / 16 }

/**
 * 발표 모드(P9) — 전체화면으로 슬라이드 표시 + 키보드 네비게이션(←/→, Esc).
 * 발표자 노트 토글. 뷰포트에 맞춰 슬라이드를 비율 유지 스케일.
 */
export function PresentMode({
  deck,
  theme,
  active,
  setActive,
  onExit,
}: {
  deck: Deck
  theme: Theme
  active: number
  setActive: (i: number) => void
  onExit: () => void
}) {
  const [vp, setVp] = useState({ w: 1280, h: 720 })
  const [showNotes, setShowNotes] = useState(false)
  const total = deck.slides.length
  const slide = deck.slides[active]

  useEffect(() => {
    const update = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') setActive(Math.min(active + 1, total - 1))
      else if (e.key === 'ArrowLeft') setActive(Math.max(active - 1, 0))
      else if (e.key === 'Escape') onExit()
      else if (e.key === 'n' || e.key === 'N') setShowNotes((s) => !s)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, total, setActive, onExit])

  const aspect = ASPECT[deck.aspectRatio] ?? 16 / 9
  const notesH = showNotes ? 140 : 0
  const availH = vp.h - notesH
  const slideW = Math.min(vp.w * 0.96, (availH - 40) * aspect)
  const nextSlide = deck.slides[active + 1]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black" data-testid="present-mode">
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {slide && (
          <ScaledSlide width={slideW} aspectRatio={deck.aspectRatio}>
            <SlideView slide={slide} theme={theme} aspectRatio={deck.aspectRatio} />
          </ScaledSlide>
        )}
        {/* 발표자 뷰 — 다음 슬라이드 미리보기(우하단) */}
        {nextSlide && (
          <div className="absolute bottom-4 right-4 hidden overflow-hidden rounded-lg border border-white/20 opacity-80 md:block" data-testid="present-next-preview">
            <div className="bg-black/70 px-2 py-0.5 text-[10px] text-white/60">다음</div>
            <ScaledSlide width={200} aspectRatio={deck.aspectRatio}>
              <SlideView slide={nextSlide} theme={theme} aspectRatio={deck.aspectRatio} />
            </ScaledSlide>
          </div>
        )}
      </div>

      {showNotes && (
        <div className="max-h-[140px] overflow-y-auto border-t border-white/10 bg-neutral-900 p-4 text-sm text-white/80">
          <div className="mb-1 flex items-center gap-1 text-xs text-white/40"><StickyNote className="h-3 w-3" /> 발표자 노트</div>
          {slide?.notes?.trim() ? slide.notes : <span className="text-white/30">이 슬라이드에 노트가 없습니다.</span>}
        </div>
      )}

      {/* 컨트롤 바 */}
      <div className="flex items-center justify-center gap-4 bg-black/80 py-3 text-white">
        <button onClick={() => setActive(Math.max(active - 1, 0))} disabled={active === 0}
          data-testid="present-prev" className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-30" aria-label="이전">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span data-testid="present-counter" className="min-w-[80px] text-center font-mono text-sm">{active + 1} / {total}</span>
        <button onClick={() => setActive(Math.min(active + 1, total - 1))} disabled={active === total - 1}
          data-testid="present-next" className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-30" aria-label="다음">
          <ChevronRight className="h-5 w-5" />
        </button>
        <button onClick={() => setShowNotes((s) => !s)} className="ml-4 rounded-lg p-2 hover:bg-white/10" aria-label="노트 토글">
          <StickyNote className={showNotes ? 'h-5 w-5 text-teal' : 'h-5 w-5'} />
        </button>
        <button onClick={onExit} data-testid="present-exit" className="rounded-lg p-2 hover:bg-white/10" aria-label="발표 종료">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

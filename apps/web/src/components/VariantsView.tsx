import { useEffect, useState } from 'react'
import { X, Loader2, Shapes } from 'lucide-react'
import { SlideView, ScaledSlide } from '@im-ppt/renderer'
import type { Deck, Slide, Theme } from '@im-ppt/schema'
import { api } from '@/lib/api'

/**
 * 슬라이드 디자인 변형(P8 UI) — 같은 내용의 다른 레이아웃 3종을 AI가 제안.
 * 각 변형을 실제 렌더 썸네일로 미리보고 클릭하면 현재 슬라이드를 그 디자인으로 교체.
 */
export function VariantsView({ deck, slide, theme, onPick, onClose }: {
  deck: Deck
  slide: Slide
  theme: Theme
  onPick: (variant: Slide) => void
  onClose: () => void
}) {
  const [variants, setVariants] = useState<Slide[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    api.slideVariants(deck.id, slide.id).then((r) => setVariants(r.variants)).catch((e) => setErr((e as Error).message))
  }, [deck.id, slide.id])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-card" onClick={(e) => e.stopPropagation()} data-testid="variants-modal">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <Shapes className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-bold">다른 디자인 제안</span>
          <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground" data-testid="variants-close"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">
          <p className="mb-4 text-sm text-muted-foreground">같은 내용을 다른 레이아웃으로 재구성했습니다. 클릭하면 현재 슬라이드가 그 디자인으로 바뀝니다.</p>
          {err && <p className="text-sm text-destructive">{err}</p>}
          {!variants && !err && (
            <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> AI가 다른 디자인을 만드는 중… (10~30초)</div>
          )}
          {variants && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" data-testid="variants-grid">
              {variants.map((v, i) => (
                <button key={i} onClick={() => onPick(v)} data-testid="variant-pick"
                  className="group overflow-hidden rounded-xl border-2 border-border transition-colors hover:border-primary">
                  <div className="pointer-events-none bg-white">
                    <ScaledSlide width={260} aspectRatio={deck.aspectRatio}>
                      <SlideView slide={v} theme={theme} />
                    </ScaledSlide>
                  </div>
                  <div className="border-t border-border bg-card px-3 py-2 text-left text-xs font-medium text-muted-foreground group-hover:text-primary">
                    {v.layoutType} 레이아웃
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import type { Deck, TemplateMeta } from '@im-ppt/schema'
import { SlideThumbnail } from '@/components/slides/SlideThumbnail'

/**
 * 템플릿 미리보기 모달(P11) — 샘플 덱의 전 슬라이드를 큰 화면 + 썸네일 릴로 보여주고
 * "이 템플릿으로 만들기"로 생성 위저드에 템플릿을 넘긴다(Canva/Genspark식).
 */
export function TemplatePreviewModal({
  template,
  deck,
  onClose,
  onUse,
}: {
  template: TemplateMeta
  deck: Deck
  onClose: () => void
  onUse: (t: TemplateMeta) => void
}) {
  const [idx, setIdx] = useState(0)
  const total = deck.slides.length
  const go = (d: number) => setIdx((i) => (i + d + total) % total)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card" onClick={(e) => e.stopPropagation()} data-testid="tpl-preview-modal">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <span className="font-display text-lg font-bold">{template.name}</span>
          <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{template.category}</span>
          <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground" data-testid="tpl-preview-close"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* 큰 미리보기 */}
          <div className="relative mx-auto w-full max-w-2xl">
            <div className="aspect-video overflow-hidden rounded-xl border border-border bg-white shadow-soft">
              <SlideThumbnail deck={deck} index={idx} />
            </div>
            <button onClick={() => go(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white" aria-label="이전"><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={() => go(1)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white" aria-label="다음"><ChevronRight className="h-5 w-5" /></button>
            <div className="mt-2 text-center text-xs text-muted-foreground">{idx + 1} / {total}</div>
          </div>

          {/* 썸네일 릴 */}
          <div className="mt-4 flex justify-center gap-2" data-testid="tpl-preview-reel">
            {deck.slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`aspect-video w-24 overflow-hidden rounded-md border-2 transition-colors ${i === idx ? 'border-primary' : 'border-border'}`}
              >
                <SlideThumbnail deck={deck} index={i} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border p-4">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">닫기</button>
          <button
            onClick={() => onUse(template)}
            data-testid="tpl-preview-use"
            className="flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2 text-sm font-semibold text-white shadow-brand"
          >
            <Sparkles className="h-4 w-4" /> 이 템플릿으로 만들기
          </button>
        </div>
      </div>
    </div>
  )
}

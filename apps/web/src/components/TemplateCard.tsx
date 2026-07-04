import { useEffect, useState } from 'react'
import type { Deck, TemplateMeta } from '@im-ppt/schema'
import { api } from '@/lib/api'
import { SlideThumbnail } from '@/components/slides/SlideThumbnail'

/**
 * 템플릿 카드(P11) — 실제 샘플 덱을 우리 렌더러로 그려 미리보기 썸네일로 보여준다(Canva식).
 * 클릭 시 상위(onPreview)로 샘플 덱을 넘겨 미리보기 모달을 연다.
 */
export function TemplateCard({
  template,
  onPreview,
  onUse,
}: {
  template: TemplateMeta
  onPreview: (t: TemplateMeta, deck: Deck) => void
  onUse: (t: TemplateMeta) => void
}) {
  const [deck, setDeck] = useState<Deck | null>(null)

  useEffect(() => {
    let alive = true
    api.templateSample(template.id).then((d) => { if (alive) setDeck(d) }).catch(() => {})
    return () => { alive = false }
  }, [template.id])

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-card"
      data-testid={`tpl-card-${template.id}`}
      onClick={() => deck && onPreview(template, deck)}
    >
      {/* 실제 렌더 미리보기(타이틀 슬라이드) */}
      <div className="relative aspect-video w-full bg-muted">
        {deck ? (
          <SlideThumbnail deck={deck} index={0} />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">미리보기 로딩…</div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
          <span className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-900">미리보기</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="min-w-0">
          <div className="truncate font-semibold">{template.name}</div>
          <div className="text-xs text-muted-foreground">레이아웃 {template.layoutTypes.length} · {template.aspectRatios.join('/')}</div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onUse(template) }}
          data-testid={`tpl-use-${template.id}`}
          className="shrink-0 rounded-lg bg-gradient-brand px-3 py-2 text-xs font-semibold text-white shadow-brand"
        >
          사용
        </button>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Loader2, Link as LinkIcon, Check } from 'lucide-react'
import type { Deck, Theme } from '@im-ppt/schema'
import { SlideView, ScaledSlide } from '@im-ppt/renderer'
import { api } from '@/lib/api'

export const Route = createFileRoute('/share/$id')({ component: SharePage })

/** 읽기 전용 공유 뷰어(P9 웹 퍼블리싱) — 에디터 크롬 없이 슬라이드만 스크롤 표시 */
function SharePage() {
  const { id } = Route.useParams()
  const [deck, setDeck] = useState<Deck | undefined>()
  const [theme, setTheme] = useState<Theme | undefined>()
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [d, themes] = await Promise.all([api.getDeck(id), api.listThemes()])
        if (!alive) return
        setDeck(d)
        setTheme(d.themeOverride ? { id: 'x', name: 'x', tokens: d.themeOverride } : themes.find((t) => t.id === d.themeId))
      } catch {
        if (alive) setNotFound(true)
      }
    })()
    return () => { alive = false }
  }, [id])

  if (notFound) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">공유된 프레젠테이션을 찾을 수 없습니다.</div>
  }
  if (!deck || !theme) {
    return <div className="flex h-screen items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> 불러오는 중…</div>
  }

  const copyLink = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-card/90 px-6 backdrop-blur">
        <span className="font-display text-lg font-bold text-primary">{deck.title}</span>
        <span className="font-mono text-xs text-muted-foreground">{deck.slides.length}장 · 읽기 전용</span>
        <button onClick={copyLink} data-testid="copy-link"
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:border-primary">
          {copied ? <Check className="h-4 w-4 text-teal" /> : <LinkIcon className="h-4 w-4" />} 링크 복사
        </button>
      </header>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        {deck.slides.map((s, i) => (
          <div key={s.id} data-testid="share-slide" className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <ScaledSlide width={896} aspectRatio={deck.aspectRatio}>
              <SlideView slide={s} theme={theme} aspectRatio={deck.aspectRatio} />
            </ScaledSlide>
            <div className="px-3 py-1.5 font-mono text-[10px] text-muted-foreground">{i + 1} / {deck.slides.length}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

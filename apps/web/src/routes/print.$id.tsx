import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import type { Deck, Theme } from '@im-ppt/schema'
import { CANVAS_SIZES } from '@im-ppt/schema'
import { SlideView } from '@im-ppt/renderer'
import { api } from '@/lib/api'

export const Route = createFileRoute('/print/$id')({ component: PrintPage })

/**
 * 인쇄/이미지 export 전용 뷰(P12 Phase 3) — 크롬 없이 각 슬라이드를 실 캔버스 크기로
 * 1페이지씩 세로로 나열. 헤드리스 크로미움이 이 페이지를 PDF 인쇄하거나 [data-slide]를
 * PNG 캡처한다. 폰트 로딩까지 끝나면 data-print-ready="1"로 준비 완료를 알린다.
 */
function PrintPage() {
  const { id } = Route.useParams()
  const [deck, setDeck] = useState<Deck>()
  const [theme, setTheme] = useState<Theme>()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [d, themes] = await Promise.all([api.getDeck(id), api.listThemes()])
      if (!alive) return
      setDeck(d)
      setTheme(
        d.themeOverride
          ? { id: 'brand', name: 'Brand', tokens: d.themeOverride }
          : themes.find((t) => t.id === d.themeId),
      )
    })()
    return () => {
      alive = false
    }
  }, [id])

  useEffect(() => {
    if (!deck || !theme) return
    let alive = true
    ;(async () => {
      try {
        await (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready
      } catch {
        /* fonts API 없으면 무시 */
      }
      // 폰트 적용 리플로우 여유
      await new Promise((r) => setTimeout(r, 350))
      if (alive) setReady(true)
    })()
    return () => {
      alive = false
    }
  }, [deck, theme])

  if (!deck || !theme) return null
  const size = CANVAS_SIZES[deck.aspectRatio]
  return (
    <div data-print-ready={ready ? '1' : '0'} style={{ background: '#fff' }}>
      <style>{`
        @page { size: ${size.width}px ${size.height}px; margin: 0; }
        html, body { margin: 0; padding: 0; background: #fff; }
        .print-slide { break-after: page; page-break-after: always; }
        .print-slide:last-child { break-after: auto; page-break-after: auto; }
      `}</style>
      {deck.slides.map((s) => (
        <div
          key={s.id}
          data-slide
          className="print-slide"
          style={{ width: size.width, height: size.height, overflow: 'hidden' }}
        >
          <SlideView slide={s} theme={theme} aspectRatio={deck.aspectRatio} />
        </div>
      ))}
    </div>
  )
}

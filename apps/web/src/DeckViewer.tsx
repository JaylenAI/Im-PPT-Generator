import { useEffect, useRef, useState } from 'react'
import type { Deck, Theme } from '@im-ppt/schema'
import { SlideView, ScaledSlide } from '@im-ppt/renderer'
import { api } from './lib/api.js'

/** 컨테이너 너비 측정 → ScaledSlide에 전달(반응형 스케일) */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => e && setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { ref, width: w }
}

export function DeckViewer({ deck, theme, onBack }: { deck: Deck; theme: Theme; onBack: () => void }) {
  const [active, setActive] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { ref, width } = useWidth()
  const slide = deck.slides[active] ?? deck.slides[0]

  const download = async () => {
    setDownloading(true)
    setError(null)
    try {
      const { exportId } = await api.createExport(deck.id)
      window.location.href = api.downloadUrl(exportId)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="shell">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <button className="btn" onClick={onBack}>
            ← 새로 만들기
          </button>
        </div>
        <div className="row">
          <span className="muted">{deck.slides.length}장</span>
          <button className="btn btn-primary" onClick={download} disabled={downloading}>
            {downloading ? <span className="spinner" /> : '⬇ PPTX 다운로드'}
          </button>
        </div>
      </div>
      <h1 className="title" style={{ marginBottom: 16 }}>
        {deck.title}
      </h1>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {slide && (
        <div className="slide-frame" ref={ref} style={{ marginBottom: 20 }}>
          {width > 0 && (
            <ScaledSlide width={width} aspectRatio={deck.aspectRatio}>
              <SlideView slide={slide} theme={theme} aspectRatio={deck.aspectRatio} />
            </ScaledSlide>
          )}
        </div>
      )}

      <div className="row" style={{ gap: 10, overflowX: 'auto' }}>
        {deck.slides.map((s, i) => (
          <div
            key={s.id}
            className={`thumb ${i === active ? 'active' : ''}`}
            style={{ width: 160, flex: '0 0 auto' }}
            onClick={() => setActive(i)}
          >
            <ScaledSlide width={160} aspectRatio={deck.aspectRatio}>
              <SlideView slide={s} theme={theme} aspectRatio={deck.aspectRatio} />
            </ScaledSlide>
          </div>
        ))}
      </div>
    </div>
  )
}

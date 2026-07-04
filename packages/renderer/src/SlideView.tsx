import type { CSSProperties } from 'react'
import type { Slide, SlideBackground, Theme } from '@im-ppt/schema'
import { CANVAS_SIZES } from '@im-ppt/schema'
import { ThemeContext, resolveCssColor } from './theme-context.js'
import { ElementView, type EditHandlers } from './elements/ElementView.js'
import { SelectionBox } from './SelectionBox.js'

export type { EditHandlers }

function backgroundStyle(bg: SlideBackground | undefined, theme: Theme): CSSProperties {
  const tokens = theme.tokens
  if (!bg) return { background: resolveCssColor('token:colors.background', tokens) }
  if (bg.kind === 'color') return { background: resolveCssColor(bg.color, tokens) }
  if (bg.kind === 'gradient') {
    return {
      background: `linear-gradient(${bg.angle}deg, ${resolveCssColor(bg.from, tokens)}, ${resolveCssColor(bg.to, tokens)})`,
    }
  }
  return {
    backgroundImage: `url(${bg.src})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}

/**
 * 슬라이드 1장을 가상 캔버스 고정 크기(예 1280×720)로 렌더.
 * exporter와 동일 좌표/토큰을 사용해 "웹에서 보이는 것 = PPTX"를 보장(ADR-005).
 * 스케일링은 소비자(ScaledSlide 또는 apps/web)가 담당.
 */
export function SlideView({
  slide,
  theme,
  aspectRatio = '16:9',
  edit,
}: {
  slide: Slide
  theme: Theme
  aspectRatio?: '16:9' | '4:3' | '9:16'
  /** 제공되면 편집 모드 — 텍스트 인라인 편집 + 요소 선택 */
  edit?: EditHandlers
}) {
  const size = CANVAS_SIZES[aspectRatio]
  return (
    <ThemeContext.Provider value={theme.tokens}>
      <div
        data-slide-id={slide.id}
        style={{
          position: 'relative',
          width: size.width,
          height: size.height,
          overflow: 'hidden',
          ...backgroundStyle(slide.background, theme),
        }}
      >
        {slide.elements.map((el) => (
          <ElementView key={el.id} el={el} {...(edit ? { edit } : {})} />
        ))}
        {edit?.selectedId &&
          (() => {
            const sel = slide.elements.find((e) => e.id === edit.selectedId)
            return sel ? <SelectionBox el={sel} handlers={edit} /> : null
          })()}
      </div>
    </ThemeContext.Provider>
  )
}

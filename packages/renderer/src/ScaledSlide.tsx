import type { ReactNode } from 'react'
import { CANVAS_SIZES } from '@im-ppt/schema'

/**
 * 고정 크기 SlideView를 주어진 표시 너비에 맞춰 스케일. 순수(측정 없음) — 캔버스 크기와
 * 목표 너비로 transform scale 계산. apps/web은 ResizeObserver로 width를 넘겨준다.
 */
export function ScaledSlide({
  children,
  width,
  aspectRatio = '16:9',
}: {
  children: ReactNode
  width: number
  aspectRatio?: '16:9' | '4:3' | '9:16'
}) {
  const canvas = CANVAS_SIZES[aspectRatio]
  const scale = width / canvas.width
  return (
    <div
      style={{
        width,
        height: canvas.height * scale,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: canvas.width,
          height: canvas.height,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}

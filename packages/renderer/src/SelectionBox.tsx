import type { PointerEvent as ReactPointerEvent } from 'react'
import type { SlideElement } from '@im-ppt/schema'
import type { EditHandlers } from './elements/ElementView.js'

/**
 * 선택 요소 오버레이(P5c) — 이동 핸들(상단 바) + 리사이즈 핸들(우하단).
 * 화면 포인터 델타를 scale로 나눠 캔버스 좌표로 변환. 드래그 시작 시 window에
 * pointermove/up 리스너를 붙여 포인터가 핸들을 벗어나도 추적(표준 드래그 패턴).
 * 드래그 중 라이브 업데이트, 종료 시 히스토리 커밋. contentEditable와 충돌 방지 위해
 * 컨테이너는 pointer-events none, 핸들만 auto.
 */
export function SelectionBox({ el, handlers }: { el: SlideElement; handlers: EditHandlers }) {
  const startDrag = (mode: 'move' | 'resize') => (e: ReactPointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const px = e.clientX
    const py = e.clientY
    const frame = { ...el.frame }
    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - px) / handlers.scale
      const dy = (ev.clientY - py) / handlers.scale
      if (mode === 'move') {
        handlers.onMoveLive(el.id, { x: Math.round(frame.x + dx), y: Math.round(frame.y + dy) })
      } else {
        handlers.onResizeLive(el.id, {
          w: Math.max(20, Math.round(frame.w + dx)),
          h: Math.max(20, Math.round(frame.h + dy)),
        })
      }
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      handlers.onDragEnd()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const ACCENT = '#6366f1'
  return (
    <div
      style={{
        position: 'absolute',
        left: el.frame.x,
        top: el.frame.y,
        width: el.frame.w,
        height: el.frame.h,
        outline: `2px solid ${ACCENT}`,
        outlineOffset: 1,
        pointerEvents: 'none',
      }}
    >
      <div
        data-testid="move-handle"
        onPointerDown={startDrag('move')}
        style={{
          position: 'absolute', left: 0, top: -24, height: 20, display: 'flex', alignItems: 'center',
          padding: '0 8px', background: ACCENT, color: '#fff', fontSize: 12, lineHeight: 1,
          cursor: 'move', pointerEvents: 'auto', borderRadius: 4, whiteSpace: 'nowrap', userSelect: 'none',
        }}
      >
        ✥ 이동
      </div>
      <div
        data-testid="resize-handle"
        onPointerDown={startDrag('resize')}
        style={{
          position: 'absolute', right: -7, bottom: -7, width: 14, height: 14,
          background: '#fff', border: `2px solid ${ACCENT}`, cursor: 'nwse-resize',
          pointerEvents: 'auto', borderRadius: 3,
        }}
      />
    </div>
  )
}

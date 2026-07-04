import { Trash2, Move, Type as TypeIcon } from 'lucide-react'
import type { Deck, Frame } from '@im-ppt/schema'

type Element = Deck['slides'][number]['elements'][number]
type TextStyle = Extract<Element, { type: 'text' }>['style']

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-1 text-xs">
      <span className="w-4 text-muted-foreground">{label}</span>
      <input
        type="number"
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
      />
    </label>
  )
}

/**
 * 속성 패널(P5b) — 선택된 요소의 위치/크기, 텍스트 색상/폰트크기를 폼으로 편집.
 * 드래그 없이도 정확한 좌표 조정 가능(WYSIWYG 보조). 변경은 즉시 덱에 반영.
 */
export function PropertyPanel({
  element,
  onFrame,
  onStyle,
  onDelete,
}: {
  element: Element
  onFrame: (patch: Partial<Frame>) => void
  onStyle: (patch: Partial<TextStyle>) => void
  onDelete: () => void
}) {
  return (
    <div className="flex-1 space-y-5 overflow-y-auto p-4 text-white">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Move className="h-4 w-4 text-teal" /> 요소 속성
        <span className="ml-auto rounded bg-sidebar-accent px-2 py-0.5 font-mono text-[10px] text-sidebar-foreground/70">
          {element.type}
        </span>
      </div>

      <div>
        <div className="mb-2 text-xs font-medium text-sidebar-foreground/60">위치 · 크기</div>
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" value={element.frame.x} onChange={(x) => onFrame({ x })} />
          <NumberField label="Y" value={element.frame.y} onChange={(y) => onFrame({ y })} />
          <NumberField label="W" value={element.frame.w} onChange={(w) => onFrame({ w })} />
          <NumberField label="H" value={element.frame.h} onChange={(h) => onFrame({ h })} />
        </div>
      </div>

      {element.type === 'text' && (
        <div>
          <div className="mb-2 flex items-center gap-1 text-xs font-medium text-sidebar-foreground/60">
            <TypeIcon className="h-3 w-3" /> 텍스트
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs">
              <span className="w-12 text-muted-foreground">색상</span>
              <input
                type="color"
                data-testid="prop-color"
                value={/^#[0-9a-fA-F]{6}$/.test(element.style.color ?? '') ? element.style.color : '#0f172a'}
                onChange={(e) => onStyle({ color: e.target.value })}
                className="h-7 w-10 rounded border border-border bg-transparent"
              />
            </label>
            <label className="flex items-center gap-2 text-xs">
              <span className="w-12 text-muted-foreground">크기</span>
              <input
                type="number"
                value={element.style.fontSize ?? ''}
                placeholder="자동"
                onChange={(e) => onStyle({ fontSize: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
              />
            </label>
          </div>
        </div>
      )}

      <button
        onClick={onDelete}
        data-testid="prop-delete"
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-destructive/40 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-3.5 w-3.5" /> 요소 삭제
      </button>
    </div>
  )
}

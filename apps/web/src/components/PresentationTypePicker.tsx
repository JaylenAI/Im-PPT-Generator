import { useEffect, useState } from 'react'
import { Presentation, GraduationCap, TrendingUp, Briefcase, UserCheck, LayoutGrid } from 'lucide-react'
import type { PresentationType, PresentationTypeId } from '@im-ppt/schema'
import { api } from '@/lib/api'

/** 유형별 아이콘 — id로 매핑(없으면 기본) */
const ICONS: Record<string, typeof Presentation> = {
  general: LayoutGrid,
  interview: UserCheck,
  consulting: Briefcase,
  ir_pitch: TrendingUp,
  academic: GraduationCap,
  sales: Presentation,
}

/**
 * 발표 유형 선택기(ADR-010) — "무슨 발표인가"를 먼저 고르면 그 장르의 서사 골격이 적용된다.
 * 선택 시 그 유형의 권장 슬라이드 수(defaultSlides)를 부모에 알려 슬라이드 수를 제안.
 */
export function PresentationTypePicker({
  value,
  onChange,
}: {
  value: PresentationTypeId
  onChange: (id: PresentationTypeId, type: PresentationType) => void
}) {
  const [types, setTypes] = useState<PresentationType[]>([])

  useEffect(() => {
    api.listPresentationTypes().then(setTypes).catch(() => {})
  }, [])

  if (types.length === 0) return null
  const active = types.find((t) => t.id === value)

  return (
    <div className="mt-5" data-testid="ptype-picker">
      <div className="mb-2 text-xs font-medium text-muted-foreground">발표 유형</div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {types.map((t) => {
          const Icon = ICONS[t.id] ?? LayoutGrid
          const on = t.id === value
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id, t)}
              title={t.description}
              data-testid={`ptype-${t.id}`}
              aria-pressed={on}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors ${
                on ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium leading-tight">{t.label}</span>
            </button>
          )
        })}
      </div>
      {active && (
        <p className="mt-2 text-xs text-muted-foreground" data-testid="ptype-desc">
          {active.description} · <span className="text-teal">{active.narrative}</span>
        </p>
      )}
    </div>
  )
}

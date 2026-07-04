import { useEffect, useState } from 'react'
import { Presentation, GraduationCap, TrendingUp, Briefcase, UserCheck, LayoutGrid } from 'lucide-react'
import type { PresentationType, PresentationTypeId, Theme } from '@im-ppt/schema'
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
  const [accents, setAccents] = useState<Record<string, string>>({})

  useEffect(() => {
    api.listPresentationTypes().then(setTypes).catch(() => {})
    // 유형별 기본 테마의 accent 색을 점으로 노출 — 장르별 시각 정체성 미리보기
    api
      .listThemes()
      .then((themes: Theme[]) =>
        setAccents(Object.fromEntries(themes.map((t) => [t.id, t.tokens.colors.accent]))),
      )
      .catch(() => {})
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
              {accents[t.defaultThemeId] && (
                <span
                  className="h-1.5 w-6 rounded-full"
                  style={{ backgroundColor: accents[t.defaultThemeId] }}
                  title="장르 기본 테마 색"
                  data-testid={`ptype-accent-${t.id}`}
                />
              )}
            </button>
          )
        })}
      </div>
      {active && (
        <p className="mt-2 text-xs text-muted-foreground" data-testid="ptype-desc">
          {active.description} · <span className="text-teal">{active.narrative}</span>
          <span className="text-muted-foreground"> · 테마 자동 적용(미선택 시)</span>
        </p>
      )}
    </div>
  )
}

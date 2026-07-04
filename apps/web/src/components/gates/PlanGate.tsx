import { ArrowLeft, Wand2, Layers } from 'lucide-react'
import type { SlidePlan } from '@im-ppt/schema'

/**
 * 슬라이드별 계획 승인 게이트(HITL③, 시장 공백 차별화) — 생성 전에 슬라이드마다
 * 어떤 의도로 무슨 내용을 담을지 보고. 유저가 확인 후 승인하면 실제 생성 시작.
 */
export function PlanGate({
  plans,
  busy,
  onApprove,
  onBack,
}: {
  plans: SlidePlan[]
  busy: boolean
  onApprove: () => void
  onBack: () => void
}) {
  return (
    <div className="mx-auto max-w-3xl px-10 py-14">
      <div className="mb-6">
        <div className="text-xs font-mono text-teal">게이트 2/2 · 슬라이드 계획 승인</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">각 슬라이드를 이렇게 만들 예정입니다</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          슬라이드별 설계 의도와 담을 내용을 확인하세요. 승인하면 실제 생성이 시작됩니다.
        </p>
      </div>

      <div className="space-y-3">
        {plans.map((p, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-brand font-mono text-xs text-white">
                {i + 1}
              </span>
              <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                <Layers className="h-3 w-3" /> {p.layoutType}
              </span>
              {p.factIds.length > 0 && (
                <span className="rounded-md bg-teal/10 px-2 py-0.5 font-mono text-[10px] text-teal">
                  근거 {p.factIds.length}
                </span>
              )}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">의도 </span>
              {p.designIntent}
            </div>
            <div className="mt-1 text-sm">
              <span className="text-muted-foreground">내용 </span>
              {p.contentSummary}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={onBack}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground hover:border-primary disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" /> 목차로
        </button>
        <button
          onClick={onApprove}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-brand py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-50"
        >
          <Wand2 className="h-4 w-4" /> 승인하고 생성 시작
        </button>
      </div>
    </div>
  )
}

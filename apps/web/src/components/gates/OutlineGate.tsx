import { useState } from 'react'
import { ArrowLeft, ArrowRight, Trash2, FileSearch } from 'lucide-react'
import type { Outline, Source, Fact } from '@im-ppt/schema'

/**
 * 아웃라인 승인 게이트(HITL②) — AI가 짠 목차를 유저가 편집/삭제 후 승인.
 * 리서치가 있으면 수집된 소스·팩트 수도 함께 보고(할루시네이션 제로 가시화).
 */
export function OutlineGate({
  outline,
  sources,
  facts,
  busy,
  onApprove,
  onBack,
}: {
  outline: Outline
  sources: Source[]
  facts: Fact[]
  busy: boolean
  onApprove: (outline: Outline) => void
  onBack: () => void
}) {
  const [sections, setSections] = useState(outline.sections)

  const setTitle = (id: string, title: string) =>
    setSections((s) => s.map((sec) => (sec.id === id ? { ...sec, title } : sec)))
  const remove = (id: string) => setSections((s) => s.filter((sec) => sec.id !== id))

  return (
    <div className="mx-auto max-w-2xl px-10 py-14">
      <div className="mb-6">
        <div className="text-xs font-mono text-teal">게이트 1/2 · 목차 승인</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">이 목차로 진행할까요?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          슬라이드 제목을 다듬거나 불필요한 섹션을 지운 뒤 승인하세요.
        </p>
      </div>

      {(sources.length > 0 || facts.length > 0) && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm">
          <FileSearch className="h-4 w-4 text-primary" />
          <span>
            리서치: 소스 <b>{sources.length}</b>개 · 근거 팩트 <b>{facts.length}</b>개 수집됨
          </span>
        </div>
      )}

      <div className="space-y-2">
        {sections.map((sec, i) => (
          <div key={sec.id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary font-mono text-xs">
              {i + 1}
            </span>
            <input
              value={sec.title}
              onChange={(e) => setTitle(sec.id, e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
            />
            {sec.layoutHint && (
              <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                {sec.layoutHint}
              </span>
            )}
            <button
              onClick={() => remove(sec.id)}
              disabled={sections.length <= 1}
              className="text-muted-foreground hover:text-destructive disabled:opacity-30"
              aria-label="섹션 삭제"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={onBack}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground hover:border-primary disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" /> 뒤로
        </button>
        <button
          onClick={() => onApprove({ ...outline, sections, status: 'approved' })}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-brand py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-50"
        >
          목차 승인 <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

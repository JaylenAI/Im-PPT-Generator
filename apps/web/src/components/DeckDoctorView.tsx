import { useEffect, useState } from 'react'
import { X, Stethoscope, AlertTriangle, Check, Info, Wand2, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import type { Deck } from '@im-ppt/schema'

interface Issue {
  slideId: string
  slideIndex: number
  kind: string
  severity: 'high' | 'medium' | 'low'
  message: string
  suggestion: string
}
interface Diagnosis {
  score: number
  slideCount: number
  clean: boolean
  issues: Issue[]
}

const SEV_STYLE: Record<Issue['severity'], string> = {
  high: 'border-destructive/40 bg-destructive/5 text-destructive',
  medium: 'border-amber-500/40 bg-amber-500/5 text-amber-600',
  low: 'border-border bg-muted/30 text-muted-foreground',
}
const SEV_LABEL: Record<Issue['severity'], string> = { high: '높음', medium: '중간', low: '낮음' }

function scoreColor(score: number): string {
  if (score >= 85) return 'text-teal'
  if (score >= 60) return 'text-amber-600'
  return 'text-destructive'
}

/**
 * Deck Doctor — 슬라이드 레벨 품질 진단 뷰. 점수 + 슬라이드별 개선점(심각도·제안).
 * Ghost Deck이 "제목 논리"라면 Doctor는 "각 장이 발표 보조물로 적절한가".
 */
export function DeckDoctorView({
  deckId,
  onClose,
  onFixed,
}: {
  deckId: string
  onClose: () => void
  onFixed?: (deck: Deck) => void
}) {
  const [diag, setDiag] = useState<Diagnosis | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [fixing, setFixing] = useState(false)
  const [fixMsg, setFixMsg] = useState<string | null>(null)

  useEffect(() => {
    api.doctor(deckId).then(setDiag).catch((e) => setErr((e as Error).message))
  }, [deckId])

  const runFix = async () => {
    setFixing(true)
    setErr(null)
    setFixMsg(null)
    try {
      const r = await api.doctorFix(deckId)
      setDiag(r.after as unknown as Diagnosis)
      setFixMsg(`AI가 ${r.fixedSlides}개 슬라이드를 개선했습니다 · 점수 ${r.before.score} → ${r.after.score}`)
      if (r.fixedSlides > 0) onFixed?.(r.deck)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setFixing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border p-4">
          <Stethoscope className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-bold">품질 진단 (Deck Doctor)</span>
          {diag && !diag.clean && (
            <button
              onClick={runFix}
              disabled={fixing}
              data-testid="doctor-fix-btn"
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-gradient-brand px-3 py-1.5 text-sm font-semibold text-white shadow-brand disabled:opacity-60"
            >
              {fixing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {fixing ? '개선 중…' : 'AI 자동 수정'}
            </button>
          )}
          <button onClick={onClose} className={`text-muted-foreground hover:text-foreground ${diag && !diag.clean ? 'ml-2' : 'ml-auto'}`} data-testid="doctor-close"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[64vh] overflow-y-auto p-5">
          {err && <p className="text-sm text-destructive">{err}</p>}
          {fixMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-teal/10 px-4 py-2.5 text-sm text-teal" data-testid="doctor-fix-msg">
              <Check className="h-4 w-4" /> {fixMsg}
            </div>
          )}
          {diag && (
            <>
              <div className="mb-4 flex items-center gap-4 rounded-xl border border-border bg-muted/20 px-5 py-4">
                <div className="text-center">
                  <div className={`font-display text-4xl font-bold ${scoreColor(diag.score)}`} data-testid="doctor-score">{diag.score}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">품질 점수</div>
                </div>
                <div className="text-sm">
                  {diag.clean ? (
                    <span className="flex items-center gap-2 text-teal"><Check className="h-4 w-4" /> 발표 보조물 원칙을 잘 지킵니다</span>
                  ) : (
                    <span className="text-muted-foreground">개선점 <b className="text-foreground">{diag.issues.length}</b>건 · 슬라이드 {diag.slideCount}장</span>
                  )}
                </div>
              </div>
              <ul className="space-y-2" data-testid="doctor-issues">
                {diag.issues.map((it, i) => (
                  <li key={i} className={`rounded-lg border p-3 text-sm ${SEV_STYLE[it.severity]}`}>
                    <div className="flex items-center gap-2">
                      {it.severity === 'low' ? <Info className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                      <span className="font-mono text-xs">슬라이드 {it.slideIndex + 1}</span>
                      <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px]">{SEV_LABEL[it.severity]}</span>
                      <span className="font-medium">{it.message}</span>
                    </div>
                    <div className="mt-1 pl-6 text-xs opacity-80">→ {it.suggestion}</div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

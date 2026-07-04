import { useEffect, useState } from 'react'
import { X, ListChecks, AlertTriangle, Check } from 'lucide-react'
import { api } from '@/lib/api'

interface Ghost {
  titles: string[]
  coherent: boolean
  issues: Array<{ index: number; kind: string; detail: string }>
}

/**
 * Ghost Deck / Titles Test(ADR-009) — 제목(핵심 주장)만 순서대로 읽어 논리가 통하는지 점검.
 * "제목만 읽어도 전체 스토리가 되는가"를 시각화. 컨설팅 덱 리뷰 방식.
 */
export function GhostDeckView({ deckId, onClose }: { deckId: string; onClose: () => void }) {
  const [ghost, setGhost] = useState<Ghost | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    api.ghostDeck(deckId).then(setGhost).catch((e) => setErr((e as Error).message))
  }, [deckId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border p-4">
          <ListChecks className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-bold">제목 논리 점검 (Titles Test)</span>
          <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground" data-testid="ghost-close"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-5">
          <p className="mb-4 text-sm text-muted-foreground">제목만 순서대로 읽어서 전체 논리가 자연스럽게 흐르면 좋은 덱입니다.</p>
          {err && <p className="text-sm text-destructive">{err}</p>}
          {ghost && (
            <>
              <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm ${ghost.coherent ? 'bg-teal/10 text-teal' : 'bg-amber-500/10 text-amber-600'}`}>
                {ghost.coherent ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                {ghost.coherent ? '논리 골격 통과 — 제목만으로 스토리가 됩니다' : `점검 필요 — 이슈 ${ghost.issues.length}건`}
              </div>
              <ol className="space-y-2" data-testid="ghost-titles">
                {ghost.titles.map((t, i) => {
                  const issue = ghost.issues.find((x) => x.index === i)
                  return (
                    <li key={i} className={`flex gap-3 rounded-lg border p-3 text-sm ${issue ? 'border-amber-500/40 bg-amber-500/5' : 'border-border'}`}>
                      <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
                      <div>
                        <div>{t}</div>
                        {issue && <div className="mt-1 text-xs text-amber-600">⚠ {issue.detail}</div>}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

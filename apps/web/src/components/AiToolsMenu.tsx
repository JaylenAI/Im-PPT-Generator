import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Wand2, FileText, MessageCircleQuestion, Accessibility, Languages, PenLine, X, Loader2, Check, AlertTriangle, ChevronDown } from 'lucide-react'
import type { Deck } from '@im-ppt/schema'
import { api } from '@/lib/api'

type Tool = 'notes' | 'questions' | 'a11y' | 'translate' | 'rewrite'

const LANGUAGES = ['English', '日本語', '中文', 'Español', 'Français', 'Deutsch', 'Tiếng Việt']
const REWRITE_PRESETS = [
  { label: '더 간결하게', instr: '각 슬라이드를 더 간결하고 핵심만 남기게 다듬어줘' },
  { label: '더 임팩트 있게', instr: '더 임팩트 있고 설득력 있는 표현으로 바꿔줘' },
  { label: '더 격식 있게', instr: '더 격식 있고 전문적인 톤으로 바꿔줘' },
  { label: '더 쉽고 친근하게', instr: '전문용어를 줄이고 쉽고 친근한 톤으로 바꿔줘' },
]

/**
 * 에디터 AI 도구 메뉴 — 덱 단위 AI 액션 5종(발표자 노트·예상 질문·접근성·번역·리라이트).
 * 노트는 현재 덱을 갱신, 번역·리라이트는 새 덱을 만들어 이동, 질문·접근성은 결과 모달.
 */
export function AiToolsMenu({ deck, onDeckUpdate }: { deck: Deck; onDeckUpdate: (d: Deck) => void }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [tool, setTool] = useState<Tool | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const runNotes = async () => {
    setOpen(false); setBusy('notes'); setFlash(null)
    try {
      const r = await api.generateSpeakerNotes(deck.id)
      onDeckUpdate(r.deck)
      setFlash('발표자 노트를 생성했습니다 (발표 모드에서 확인)')
    } catch (e) { setFlash(`실패: ${(e as Error).message}`) } finally { setBusy(null) }
  }

  const items: Array<{ id: Tool | 'notes'; label: string; icon: typeof Wand2; desc: string; onClick: () => void }> = [
    { id: 'notes', label: '발표자 노트 생성', icon: FileText, desc: '슬라이드별 발표 스크립트', onClick: runNotes },
    { id: 'questions', label: '예상 질문 뽑기', icon: MessageCircleQuestion, desc: '발표 후 나올 질문 대비', onClick: () => { setTool('questions'); setOpen(false) } },
    { id: 'a11y', label: '접근성 점검', icon: Accessibility, desc: '색 대비·대체텍스트 WCAG', onClick: () => { setTool('a11y'); setOpen(false) } },
    { id: 'translate', label: '번역', icon: Languages, desc: '다른 언어 덱 만들기', onClick: () => { setTool('translate'); setOpen(false) } },
    { id: 'rewrite', label: '톤 리라이트', icon: PenLine, desc: '톤·길이 바꿔 다시 쓰기', onClick: () => { setTool('rewrite'); setOpen(false) } },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        data-testid="ai-tools-btn"
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} AI 도구 <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-card" data-testid="ai-tools-menu">
          {items.map((it) => (
            <button key={it.id} onClick={it.onClick} data-testid={`ai-tool-${it.id}`}
              className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-secondary">
              <it.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                <span className="block text-sm font-medium">{it.label}</span>
                <span className="block text-xs text-muted-foreground">{it.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {flash && (
        <div className="absolute right-0 z-50 mt-2 flex w-72 items-center gap-2 rounded-xl border border-teal/40 bg-card px-4 py-3 text-sm text-teal shadow-card" data-testid="ai-tools-flash">
          <Check className="h-4 w-4 shrink-0" /> {flash}
          <button onClick={() => setFlash(null)} className="ml-auto text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
      )}

      {tool === 'questions' && <QuestionsModal deck={deck} onClose={() => setTool(null)} />}
      {tool === 'a11y' && <AccessibilityModal deck={deck} onClose={() => setTool(null)} />}
      {tool === 'translate' && (
        <TransformDialog
          title="번역" testid="translate"
          hint="선택한 언어로 전체 슬라이드를 번역한 새 덱을 만듭니다(원본 유지)."
          options={LANGUAGES.map((l) => ({ label: l, value: l }))}
          run={async (lang) => api.translateDeck(deck.id, lang)}
          onDone={(id) => navigate({ to: '/editor/$id', params: { id } })}
          onClose={() => setTool(null)}
        />
      )}
      {tool === 'rewrite' && (
        <TransformDialog
          title="톤 리라이트" testid="rewrite"
          hint="톤·길이를 바꿔 다시 쓴 새 덱을 만듭니다(원본 유지)."
          options={REWRITE_PRESETS.map((p) => ({ label: p.label, value: p.instr }))}
          allowCustom
          run={async (instr) => api.rewriteDeck(deck.id, instr)}
          onDone={(id) => navigate({ to: '/editor/$id', params: { id } })}
          onClose={() => setTool(null)}
        />
      )}
    </div>
  )
}

function Modal({ title, testid, onClose, children }: { title: string; testid: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-card" onClick={(e) => e.stopPropagation()} data-testid={`${testid}-modal`}>
        <div className="flex items-center gap-2 border-b border-border p-4">
          <span className="font-display text-lg font-bold">{title}</span>
          <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground" data-testid={`${testid}-close`}><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[64vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

function QuestionsModal({ deck, onClose }: { deck: Deck; onClose: () => void }) {
  const [qs, setQs] = useState<string[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => { api.audienceQuestions(deck.id).then((r) => setQs(r.questions)).catch((e) => setErr((e as Error).message)) }, [deck.id])
  return (
    <Modal title="예상 청중 질문" testid="questions" onClose={onClose}>
      <p className="mb-3 text-sm text-muted-foreground">발표 후 나올 만한 질문입니다. 미리 답을 준비하세요.</p>
      {err && <p className="text-sm text-destructive">{err}</p>}
      {!qs && !err && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> AI가 질문을 뽑는 중…</div>}
      <ol className="space-y-2" data-testid="questions-list">
        {qs?.map((q, i) => (
          <li key={i} className="flex gap-3 rounded-lg border border-border p-3 text-sm">
            <span className="font-mono text-xs text-primary">Q{i + 1}</span><span>{q}</span>
          </li>
        ))}
      </ol>
    </Modal>
  )
}

function AccessibilityModal({ deck, onClose }: { deck: Deck; onClose: () => void }) {
  const [rep, setRep] = useState<Awaited<ReturnType<typeof api.accessibility>> | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => { api.accessibility(deck.id).then(setRep).catch((e) => setErr((e as Error).message)) }, [deck.id])
  return (
    <Modal title="접근성 점검 (WCAG)" testid="a11y" onClose={onClose}>
      {err && <p className="text-sm text-destructive">{err}</p>}
      {rep && (
        <>
          <div className="mb-4 flex items-center gap-4 rounded-xl border border-border bg-muted/20 px-5 py-4">
            <div className="text-center">
              <div className={`font-display text-4xl font-bold ${rep.score >= 90 ? 'text-teal' : rep.score >= 70 ? 'text-amber-600' : 'text-destructive'}`} data-testid="a11y-score">{rep.score}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">접근성 점수</div>
            </div>
            <div className="text-sm text-muted-foreground">
              {rep.issues.length === 0 ? <span className="flex items-center gap-2 text-teal"><Check className="h-4 w-4" /> 색 대비·대체텍스트 문제 없음</span> : <>요소 {rep.checked}개 검사 · 이슈 {rep.issues.length}건</>}
            </div>
          </div>
          <ul className="space-y-2" data-testid="a11y-issues">
            {rep.issues.map((it, i) => (
              <li key={i} className={`rounded-lg border p-3 text-sm ${it.severity === 'error' ? 'border-destructive/40 bg-destructive/5 text-destructive' : 'border-amber-500/40 bg-amber-500/5 text-amber-600'}`}>
                <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /><span className="font-mono text-xs">슬라이드 {it.slideIndex + 1}</span><span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px]">{it.kind}</span></div>
                <div className="mt-1 pl-6 text-xs opacity-80">{it.detail}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  )
}

/** 옵션 선택(+선택적 자유 입력) → run 실행 → 새 덱으로 이동. 번역/리라이트 공용 */
function TransformDialog({ title, testid, hint, options, allowCustom, run, onDone, onClose }: {
  title: string; testid: string; hint: string
  options: Array<{ label: string; value: string }>; allowCustom?: boolean
  run: (value: string) => Promise<{ deckId: string }>; onDone: (id: string) => void; onClose: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [custom, setCustom] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const go = async (value: string) => {
    if (!value.trim() || busy) return
    setBusy(true); setErr(null)
    try { const r = await run(value); onDone(r.deckId) } catch (e) { setErr((e as Error).message); setBusy(false) }
  }
  return (
    <Modal title={title} testid={testid} onClose={onClose}>
      <p className="mb-4 text-sm text-muted-foreground">{hint}</p>
      {busy ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> AI가 처리 중… 잠시만요</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" data-testid={`${testid}-options`}>
            {options.map((o) => (
              <button key={o.value} onClick={() => go(o.value)} data-testid={`${testid}-opt`}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:border-primary hover:text-primary">
                {o.label}
              </button>
            ))}
          </div>
          {allowCustom && (
            <div className="mt-3 flex gap-2">
              <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="직접 지시(예: 발표 시간 3분에 맞게 줄여줘)"
                onKeyDown={(e) => e.key === 'Enter' && go(custom)}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              <button onClick={() => go(custom)} className="rounded-lg bg-gradient-brand px-4 text-sm font-semibold text-white">적용</button>
            </div>
          )}
          {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
        </>
      )}
    </Modal>
  )
}

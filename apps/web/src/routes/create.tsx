import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Sparkles, Loader2, Check } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { useAppStore } from '@/lib/store'
import type { TemplateMeta } from '@im-ppt/schema'
import { api, type GenerateInput } from '@/lib/api'

export const Route = createFileRoute('/create')({
  component: CreatePage,
})

type Preset = NonNullable<GenerateInput['preset']>
const PRESETS: Array<{ id: Preset; label: string; desc: string }> = [
  { id: 'quick', label: '빠르게', desc: '리서치·승인 없이 자동' },
  { id: 'standard', label: '표준', desc: '목차 승인 (예정)' },
  { id: 'research', label: '리서치', desc: '딥서치+팩트 승인 (예정)' },
]
const EXAMPLES = ['재생에너지의 미래', 'Q4 시장 진입 전략', '초보자를 위한 머신러닝 입문']

interface LogLine {
  text: string
  done: boolean
}

function CreatePage() {
  const navigate = useNavigate()
  const addDeck = useAppStore((s) => s.addDeck)
  const loadThemes = useAppStore((s) => s.loadThemes)
  const [topic, setTopic] = useState('')
  const [preset, setPreset] = useState<Preset>('quick')
  const [slideCount, setSlideCount] = useState(8)
  const [templateId, setTemplateId] = useState('')
  const [templates, setTemplates] = useState<TemplateMeta[]>([])
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState<LogLine[]>([])
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.listTemplates().then((t) => { setTemplates(t); setTemplateId(t[0]?.id ?? '') }).catch(() => {})
  }, [])
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [log])

  const addLog = (text: string, done = false) => setLog((l) => [...l, { text, done }])

  const start = async () => {
    if (!topic.trim() || busy) return
    setBusy(true)
    setError(null)
    setLog([])
    setProgress({ done: 0, total: 0 })
    await loadThemes()
    try {
      await api.streamDeck(
        { prompt: topic.trim(), preset, slideCount, language: '한국어', ...(templateId ? { templateId } : {}) },
        (e) => {
          if (e.type === 'job_started') addLog('생성 시작…')
          else if (e.type === 'outline_ready') {
            setProgress({ done: 0, total: e.outline.sections.length })
            addLog(`목차 완성 — ${e.outline.sections.length}개 섹션`, true)
            e.outline.sections.forEach((s, i) => addLog(`슬라이드 ${i + 1}: ${s.title}`))
          } else if (e.type === 'slide_done') {
            setProgress((p) => ({ ...p, done: p.done + 1 }))
            addLog(`슬라이드 완성 (${e.slide.layoutType})`, true)
          } else if (e.type === 'deck_saved') {
            addDeck(e.deck)
            addLog('완료! 에디터로 이동합니다…', true)
            setTimeout(() => navigate({ to: '/editor/$id', params: { id: e.deck.id } }), 600)
          } else if (e.type === 'job_error') {
            setError(e.message)
            setBusy(false)
          }
        },
      )
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  if (busy) {
    const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-10 py-16">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand shadow-brand">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
            <div>
              <div className="font-display text-xl font-bold">실시간 생성 중</div>
              <div className="font-mono text-xs text-teal">
                {progress.total ? `${progress.done}/${progress.total} 슬라이드` : 'AI가 설계하고 있습니다…'}
              </div>
            </div>
          </div>
          {progress.total > 0 && (
            <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-gradient-brand transition-all" style={{ width: `${pct}%` }} />
            </div>
          )}
          <div ref={logRef} className="max-h-[420px] overflow-y-auto rounded-2xl border border-border bg-card p-5">
            {log.map((l, i) => (
              <div key={i} className="flex items-center gap-2 py-1 text-sm">
                {l.done ? (
                  <Check className="h-4 w-4 shrink-0 text-teal" />
                ) : (
                  <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-primary" />
                )}
                <span className={l.done ? 'text-foreground' : 'text-muted-foreground'}>{l.text}</span>
              </div>
            ))}
          </div>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-10 py-16">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand shadow-brand">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">무엇을 만들까요?</h1>
          <p className="mt-3 text-muted-foreground">주제를 입력하면 AI가 아웃라인을 짜고 모든 페이지를 생성합니다.</p>
        </div>

        {error && <p className="mb-4 text-center text-sm text-destructive">{error}</p>}

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <textarea
            rows={3}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="예: 중소기업을 위한 클라우드 전환 전략, 임원 대상, 15장"
            className="w-full resize-none rounded-xl border border-border bg-background p-4 text-sm outline-none focus:border-primary"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => setTopic(ex)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary">
                {ex}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                title={p.desc}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${preset === p.id ? 'bg-gradient-brand text-white' : 'border border-border text-muted-foreground hover:border-primary'}`}
              >
                {p.label}
              </button>
            ))}
            <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              슬라이드
              <input type="number" min={3} max={30} value={slideCount} onChange={(e) => setSlideCount(Number(e.target.value))} className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-sm" />
            </label>
          </div>

          {templates.length > 0 && (
            <div className="mt-3">
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={start}
            disabled={!topic.trim()}
            className="mt-6 w-full rounded-xl bg-gradient-brand py-3.5 text-sm font-semibold text-white shadow-brand disabled:opacity-50"
          >
            ✨ 프레젠테이션 생성
          </button>
        </div>
      </div>
    </AppShell>
  )
}

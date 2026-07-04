import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Sparkles, Loader2, Check, Plus, X, Upload } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { OutlineGate } from '@/components/gates/OutlineGate'
import { PlanGate } from '@/components/gates/PlanGate'
import { PresentationTypePicker } from '@/components/PresentationTypePicker'
import { useAppStore } from '@/lib/store'
import type { TemplateMeta, Outline, Source, Fact, SlidePlan, PresentationTypeId } from '@im-ppt/schema'
import { api, type GenerateInput, type UserSource } from '@/lib/api'

export const Route = createFileRoute('/create')({ component: CreatePage })

type Preset = NonNullable<GenerateInput['preset']>
const PRESETS: Array<{ id: Preset; label: string; desc: string }> = [
  { id: 'quick', label: '빠르게', desc: '리서치·승인 없이 자동' },
  { id: 'standard', label: '표준', desc: '목차 승인' },
  { id: 'precision', label: '정밀', desc: '목차 + 슬라이드별 계획 승인' },
  { id: 'my_materials', label: '내 자료', desc: '내가 준 자료로 생성' },
]
const EXAMPLES = ['재생에너지의 미래', 'Q4 시장 진입 전략', '초보자를 위한 머신러닝 입문']
const usesSources = (p: Preset) => p === 'my_materials' || p === 'research'
const usesPlanGate = (p: Preset) => p === 'precision'
const usesGates = (p: Preset) => p !== 'quick'

type Phase = 'input' | 'outline' | 'plans' | 'generating'
interface LogLine { text: string; done: boolean }

function CreatePage() {
  const navigate = useNavigate()
  const addDeck = useAppStore((s) => s.addDeck)
  const loadThemes = useAppStore((s) => s.loadThemes)

  const [phase, setPhase] = useState<Phase>('input')
  const [topic, setTopic] = useState('')
  const [preset, setPreset] = useState<Preset>('quick')
  const [presentationType, setPresentationType] = useState<PresentationTypeId>('general')
  const [slideCount, setSlideCount] = useState(8)
  const [templateId, setTemplateId] = useState('')
  const [aspectRatio, setAspectRatio] = useState<NonNullable<GenerateInput['aspectRatio']>>('16:9')
  const [guide, setGuide] = useState(false)
  const [audience, setAudience] = useState('')
  const [tone, setTone] = useState('professional')
  const [templates, setTemplates] = useState<TemplateMeta[]>([])
  const [sources, setSources] = useState<UserSource[]>([])
  const [srcText, setSrcText] = useState('')

  const [outline, setOutline] = useState<Outline | null>(null)
  const [research, setResearch] = useState<{ sources: Source[]; facts: Fact[] }>({ sources: [], facts: [] })
  const [plans, setPlans] = useState<SlidePlan[]>([])

  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState<LogLine[]>([])
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.listTemplates().then((t) => { setTemplates(t); setTemplateId(t[0]?.id ?? '') }).catch(() => {})
  }, [])
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }) }, [log])

  const input = (): GenerateInput => ({
    prompt: topic.trim(), preset, slideCount, language: '한국어', aspectRatio, tone, presentationType,
    ...(audience.trim() ? { audience: audience.trim() } : {}),
    ...(templateId ? { templateId } : {}),
    ...(usesSources(preset) && sources.length ? { sources } : {}),
  })
  const addLog = (text: string, done = false) => setLog((l) => [...l, { text, done }])
  const fail = (e: unknown) => { setError((e as Error).message); setBusy(false); setPhase('input') }

  const addSource = () => {
    const t = srcText.trim()
    if (!t) return
    const src: UserSource = /^https?:\/\//i.test(t) ? { kind: 'user_url', url: t } : { kind: 'user_text', text: t }
    setSources((s) => [...s, src]); setSrcText('')
  }

  const uploadDoc = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    try {
      const { text, filename } = await api.extractDocument(file)
      setSources((s) => [...s, { kind: 'user_text', text, title: filename }])
    } catch (e) {
      setError((e as Error).message)
    }
  }

  // 진입점 — quick은 즉시 스트림, 나머지는 아웃라인 게이트로
  const start = async () => {
    if (!topic.trim() || busy) return
    setError(null)
    await loadThemes()
    if (!usesGates(preset)) return streamGenerate()
    setBusy(true)
    try {
      const r = await api.previewOutline(input())
      setOutline(r.outline); setResearch({ sources: r.sources, facts: r.facts })
      setBusy(false); setPhase('outline')
    } catch (e) { fail(e) }
  }

  // quick 경로 — 실시간 스트리밍
  const streamGenerate = async () => {
    setBusy(true); setLog([]); setProgress({ done: 0, total: 0 }); setPhase('generating')
    try {
      await api.streamDeck(input(), (e) => {
        if (e.type === 'job_started') addLog('생성 시작…')
        else if (e.type === 'outline_ready') {
          setProgress({ done: 0, total: e.outline.sections.length })
          addLog(`목차 완성 — ${e.outline.sections.length}개 섹션`, true)
        } else if (e.type === 'slide_done') {
          setProgress((p) => ({ ...p, done: p.done + 1 }))
          addLog(`슬라이드 완성 (${e.slide.layoutType})`, true)
        } else if (e.type === 'deck_saved') {
          addDeck(e.deck); addLog('완료! 에디터로 이동합니다…', true)
          setTimeout(() => navigate({ to: '/editor/$id', params: { id: e.deck.id } }), 600)
        } else if (e.type === 'job_error') fail(new Error(e.message))
      })
    } catch (e) { fail(e) }
  }

  const approveOutline = async (approved: Outline) => {
    setOutline(approved)
    if (usesPlanGate(preset)) {
      setBusy(true)
      try {
        const r = await api.previewPlans({ ...input(), outline: approved, facts: research.facts })
        setPlans(r.plans); setBusy(false); setPhase('plans')
      } catch (e) { fail(e) }
    } else {
      finalGenerate(approved)
    }
  }

  // 게이트 승인 후 최종 생성(동기) — 승인 아웃라인 + 이미 계산한 리서치 재사용
  const finalGenerate = async (approved: Outline) => {
    setBusy(true); setPhase('generating')
    try {
      const r = await api.generateApproved({
        ...input(), outline: approved,
        ...(research.sources.length || research.facts.length ? { research } : {}),
      })
      addDeck(r.deck)
      navigate({ to: '/editor/$id', params: { id: r.deck.id } })
    } catch (e) { fail(e) }
  }

  if (phase === 'outline' && outline)
    return (
      <AppShell>
        <OutlineGate outline={outline} sources={research.sources} facts={research.facts} busy={busy}
          onApprove={approveOutline} onBack={() => setPhase('input')} />
      </AppShell>
    )

  if (phase === 'plans')
    return (
      <AppShell>
        <PlanGate plans={plans} busy={busy} onApprove={() => outline && finalGenerate(outline)}
          onBack={() => setPhase('outline')} />
      </AppShell>
    )

  if (phase === 'generating') {
    const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0
    const streaming = preset === 'quick'
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-10 py-16">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand shadow-brand">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
            <div>
              <div className="font-display text-xl font-bold">{streaming ? '실시간 생성 중' : '승인한 계획으로 생성 중'}</div>
              <div className="font-mono text-xs text-teal">
                {progress.total ? `${progress.done}/${progress.total} 슬라이드` : 'AI가 설계하고 있습니다…'}
              </div>
            </div>
          </div>
          {streaming && progress.total > 0 && (
            <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-gradient-brand transition-all" style={{ width: `${pct}%` }} />
            </div>
          )}
          {streaming && (
            <div ref={logRef} className="max-h-[420px] overflow-y-auto rounded-2xl border border-border bg-card p-5">
              {log.map((l, i) => (
                <div key={i} className="flex items-center gap-2 py-1 text-sm">
                  {l.done ? <Check className="h-4 w-4 shrink-0 text-teal" /> : <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-primary" />}
                  <span className={l.done ? 'text-foreground' : 'text-muted-foreground'}>{l.text}</span>
                </div>
              ))}
            </div>
          )}
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
          <textarea rows={3} value={topic} onChange={(e) => setTopic(e.target.value)}
            placeholder="예: 중소기업을 위한 클라우드 전환 전략, 임원 대상, 15장"
            className="w-full resize-none rounded-xl border border-border bg-background p-4 text-sm outline-none focus:border-primary" />
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => setTopic(ex)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary">{ex}</button>
            ))}
          </div>

          <PresentationTypePicker
            value={presentationType}
            onChange={(id, type) => { setPresentationType(id); setSlideCount(type.defaultSlides) }}
          />

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => (
              <button key={p.id} onClick={() => setPreset(p.id)} title={p.desc}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${preset === p.id ? 'bg-gradient-brand text-white' : 'border border-border text-muted-foreground hover:border-primary'}`}>
                {p.label}
              </button>
            ))}
            <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              슬라이드
              <input type="number" min={3} max={30} value={slideCount} onChange={(e) => setSlideCount(Number(e.target.value))} className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-sm" />
            </label>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{PRESETS.find((p) => p.id === preset)?.desc}</p>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">화면비</span>
            {(['16:9', '4:3', '9:16'] as const).map((ar) => (
              <button key={ar} onClick={() => setAspectRatio(ar)}
                className={`rounded-lg px-2.5 py-1 font-mono text-xs ${aspectRatio === ar ? 'bg-gradient-brand text-white' : 'border border-border text-muted-foreground hover:border-primary'}`}>
                {ar}
              </button>
            ))}
            <button onClick={() => setGuide((g) => !g)} data-testid="guide-toggle"
              className={`ml-auto rounded-lg px-2.5 py-1 text-xs ${guide ? 'bg-gradient-brand text-white' : 'border border-border text-muted-foreground hover:border-primary'}`}>
              가이드 모드
            </button>
          </div>

          {guide && (
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-border bg-secondary/30 p-3" data-testid="guide-panel">
              <label className="text-xs">
                <span className="mb-1 block text-muted-foreground">청중</span>
                <input value={audience} onChange={(e) => setAudience(e.target.value)} data-testid="guide-audience"
                  placeholder="예: 임원진, 투자자, 신입"
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" />
              </label>
              <label className="text-xs">
                <span className="mb-1 block text-muted-foreground">톤</span>
                <select value={tone} onChange={(e) => setTone(e.target.value)} data-testid="guide-tone"
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
                  {['professional', 'formal', 'casual', 'academic', 'playful'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>
          )}

          {usesSources(preset) && (
            <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-3">
              <div className="mb-2 text-xs font-medium text-muted-foreground">내 자료 (URL 또는 텍스트 붙여넣기)</div>
              <div className="flex gap-2">
                <input value={srcText} onChange={(e) => setSrcText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSource())}
                  placeholder="https://... 또는 참고할 텍스트"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                <button onClick={addSource} className="rounded-lg border border-border px-3 hover:border-primary" aria-label="자료 추가"><Plus className="h-4 w-4" /></button>
                <label className="flex cursor-pointer items-center rounded-lg border border-border px-3 hover:border-primary" title="문서 업로드(PDF/DOCX/TXT/MD)">
                  <Upload className="h-4 w-4" />
                  <input type="file" accept=".pdf,.docx,.txt,.md,.markdown" className="hidden"
                    data-testid="doc-upload"
                    onChange={(e) => { void uploadDoc(e.target.files?.[0]); e.target.value = '' }} />
                </label>
              </div>
              {sources.map((s, i) => (
                <div key={i} className="mt-2 flex items-center gap-2 text-xs">
                  <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px]">{s.kind === 'user_url' ? 'URL' : 'TEXT'}</span>
                  <span className="flex-1 truncate">{s.url ?? s.text}</span>
                  <button onClick={() => setSources((ss) => ss.filter((_, j) => j !== i))} aria-label="삭제"><X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></button>
                </div>
              ))}
            </div>
          )}

          {templates.length > 0 && (
            <div className="mt-3">
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {templates.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>
            </div>
          )}

          <button onClick={start} disabled={!topic.trim() || busy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3.5 text-sm font-semibold text-white shadow-brand disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : '✨'} {usesGates(preset) ? '다음: 목차 검토' : '프레젠테이션 생성'}
          </button>
        </div>
      </div>
    </AppShell>
  )
}

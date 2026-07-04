import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Sparkles, Loader2 } from 'lucide-react'
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

function CreatePage() {
  const navigate = useNavigate()
  const generate = useAppStore((s) => s.generate)
  const [topic, setTopic] = useState('')
  const [preset, setPreset] = useState<Preset>('quick')
  const [slideCount, setSlideCount] = useState(8)
  const [templateId, setTemplateId] = useState('')
  const [templates, setTemplates] = useState<TemplateMeta[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.listTemplates().then((t) => { setTemplates(t); setTemplateId(t[0]?.id ?? '') }).catch(() => {})
  }, [])

  const start = async () => {
    if (!topic.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const deck = await generate({
        prompt: topic.trim(),
        preset,
        slideCount,
        language: '한국어',
        ...(templateId ? { templateId } : {}),
      })
      navigate({ to: '/editor/$id', params: { id: deck.id } })
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  if (busy) {
    return (
      <AppShell>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand shadow-brand">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <p className="font-mono text-sm text-teal">AI가 프레젠테이션을 설계하고 있습니다…</p>
          <p className="text-sm text-muted-foreground">아웃라인 생성 후 슬라이드를 병렬로 만듭니다 (약 1~2분)</p>
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

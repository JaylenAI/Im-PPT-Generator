import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Cpu, FileCode2, Check, Loader2, RotateCcw, ChevronDown } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { api, type ModelConnectionView, type PromptView } from '@/lib/api'

export const Route = createFileRoute('/settings')({
  head: () => ({ meta: [{ title: 'AI 설정 — Im PPT Generator' }] }),
  component: SettingsPage,
})

function SettingsPage() {
  const [models, setModels] = useState<{ connections: ModelConnectionView[]; assignments: Record<string, string> } | null>(null)
  const [prompts, setPrompts] = useState<PromptView[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    api.getModels().then(setModels).catch((e) => setErr((e as Error).message))
    api.getPrompts().then(setPrompts).catch((e) => setErr((e as Error).message))
  }, [])

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-10 py-12">
        <h1 className="text-3xl font-bold tracking-tight">AI 설정</h1>
        <p className="mt-2 text-muted-foreground">생성에 쓰이는 모델 연결과 프롬프트를 확인·조정합니다.</p>
        {err && <p className="mt-4 text-sm text-destructive">{err}</p>}

        {/* 모델 연결 */}
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold">모델 연결</h2>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">작업별로 라우팅되는 모델입니다. 연결 자체는 서버 설정(.env / 카탈로그)에서 관리합니다.</p>
          <div className="space-y-2" data-testid="settings-models">
            {models?.connections.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary"><Cpu className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.name}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px]">{c.provider}</span>
                    {c.isActive && <span className="rounded bg-teal/10 px-1.5 py-0.5 text-[10px] text-teal">활성</span>}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">{c.model} · 태그: {c.tags.join(', ') || '없음'}</div>
                </div>
              </div>
            ))}
            {models && models.connections.length === 0 && <p className="text-sm text-muted-foreground">연결된 모델이 없습니다.</p>}
          </div>
        </section>

        {/* 프롬프트 편집 */}
        <section className="mt-10">
          <div className="mb-3 flex items-center gap-2">
            <FileCode2 className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold">프롬프트</h2>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">각 단계의 지시문을 직접 조정할 수 있습니다. 변경은 다음 생성부터 반영됩니다.</p>
          <div className="space-y-2" data-testid="settings-prompts">
            {!prompts && !err && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> 불러오는 중…</div>}
            {prompts?.map((p) => <PromptEditor key={p.key} prompt={p} />)}
          </div>
        </section>
      </div>
    </AppShell>
  )
}

function PromptEditor({ prompt }: { prompt: PromptView }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState(prompt.currentContent)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [overridden, setOverridden] = useState(prompt.isOverridden)
  const dirty = content !== prompt.currentContent

  const save = async (value: string) => {
    setSaving(true); setSaved(false)
    try {
      const updated = await api.patchPrompt(prompt.key, value)
      setContent(updated.currentContent)
      prompt.currentContent = updated.currentContent
      setOverridden(updated.isOverridden)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  return (
    <div className="rounded-xl border border-border bg-card" data-testid={`prompt-${prompt.key}`}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 p-4 text-left">
        <span className="font-mono text-xs text-primary">{prompt.key}</span>
        <span className="truncate text-sm text-muted-foreground">{prompt.description}</span>
        {overridden && <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-600">수정됨</span>}
        <ChevronDown className={`ml-auto h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-border p-4">
          {prompt.variables.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {prompt.variables.map((v) => <span key={v} className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px]">{'{' + v + '}'}</span>)}
            </div>
          )}
          <textarea
            rows={10} value={content} onChange={(e) => setContent(e.target.value)}
            data-testid={`prompt-${prompt.key}-input`}
            className="w-full resize-y rounded-lg border border-border bg-background p-3 font-mono text-xs outline-none focus:border-primary"
          />
          <div className="mt-2 flex items-center gap-2">
            <button onClick={() => save(content)} disabled={!dirty || saving} data-testid={`prompt-${prompt.key}-save`}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-brand px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null} {saved ? '저장됨' : '저장'}
            </button>
            <button onClick={() => { setContent(prompt.defaultContent); void save(prompt.defaultContent) }} disabled={saving}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-secondary">
              <RotateCcw className="h-3.5 w-3.5" /> 기본값 복원
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

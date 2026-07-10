import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Upload, Loader2, Link2 } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { TemplateCard } from '@/components/TemplateCard'
import { TemplatePreviewModal } from '@/components/TemplatePreviewModal'
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import type { Deck, TemplateMeta } from '@im-ppt/schema'

export const Route = createFileRoute('/templates')({
  component: TemplatesPage,
})

const CATEGORY_LABEL: Record<string, string> = {
  all: '전체', business: '비즈니스', creative: '크리에이티브', tech: '테크', minimal: '미니멀', education: '교육',
}

function TemplatesPage() {
  const navigate = useNavigate()
  const loadThemes = useAppStore((s) => s.loadThemes)
  const [templates, setTemplates] = useState<TemplateMeta[]>([])
  const [cat, setCat] = useState('all')
  const [preview, setPreview] = useState<{ template: TemplateMeta; deck: Deck } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [brandUrl, setBrandUrl] = useState('')
  const [importingUrl, setImportingUrl] = useState(false)

  const reload = () => api.listTemplates().then(setTemplates).catch(() => {})
  useEffect(() => {
    void loadThemes() // 미리보기 렌더에 테마 필요
    void reload()
  }, [loadThemes])

  const isCustom = (t: TemplateMeta) =>
    t.source === 'user' || t.source === 'imported_pptx' || t.source === 'imported_url'
  const categories = useMemo(() => ['all', ...Array.from(new Set(templates.map((t) => t.category)))], [templates])
  const shown = cat === 'all' ? templates : templates.filter((t) => t.category === cat)

  const useTemplate = (t: TemplateMeta) => navigate({ to: '/create', search: { template: t.id } })

  const upload = async (file: File | undefined) => {
    if (!file) return
    setUploading(true); setErr(null)
    try {
      await api.createTemplateFromPptx(file)
      await reload()
    } catch (e) { setErr((e as Error).message) } finally { setUploading(false) }
  }

  const importUrl = async () => {
    const url = brandUrl.trim()
    if (!url || importingUrl) return
    setImportingUrl(true); setErr(null)
    try {
      await api.createTemplateFromUrl(url)
      setBrandUrl('')
      await reload()
    } catch (e) { setErr((e as Error).message) } finally { setImportingUrl(false) }
  }

  const remove = async (t: TemplateMeta) => {
    try { await api.deleteTemplate(t.id); await reload() } catch { /* ignore */ }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-10 py-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-1 text-2xl font-bold">템플릿 갤러리</h1>
            <p className="text-muted-foreground">{templates.length}종 · 원하는 디자인을 고르면 AI가 그 스타일로 채웁니다.</p>
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold shadow-soft hover:border-primary">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            PPTX로 내 템플릿 만들기
            <input ref={fileRef} type="file" accept=".pptx" className="hidden" data-testid="tpl-upload"
              onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = '' }} />
          </label>
        </div>

        {/* 브랜드 URL로 템플릿 만들기(P12) — 사이트 색/폰트 추출 */}
        <div className="mb-4 flex flex-col gap-2 rounded-xl border border-border bg-card/50 p-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Link2 className="h-4 w-4" /> 브랜드 사이트로 만들기
          </div>
          <input
            type="url"
            value={brandUrl}
            onChange={(e) => setBrandUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void importUrl() }}
            placeholder="https://your-brand.com"
            data-testid="tpl-brand-url"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={() => void importUrl()}
            disabled={importingUrl || !brandUrl.trim()}
            data-testid="tpl-brand-url-submit"
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand disabled:opacity-50"
          >
            {importingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            색·폰트 추출
          </button>
        </div>
        {err && <p className="mb-3 text-sm text-destructive">{err}</p>}

        {/* 카테고리 필터 */}
        <div className="mb-6 flex flex-wrap gap-2" data-testid="tpl-categories">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              data-testid={`tpl-cat-${c}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${cat === c ? 'bg-gradient-brand text-white shadow-brand' : 'border border-border text-muted-foreground hover:border-primary'}`}
            >
              {CATEGORY_LABEL[c] ?? c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              custom={isCustom(t)}
              onPreview={(tt, deck) => setPreview({ template: tt, deck })}
              onUse={useTemplate}
              onDelete={isCustom(t) ? remove : undefined}
            />
          ))}
        </div>
      </div>

      {preview && (
        <TemplatePreviewModal
          template={preview.template}
          deck={preview.deck}
          onClose={() => setPreview(null)}
          onUse={useTemplate}
        />
      )}
    </AppShell>
  )
}

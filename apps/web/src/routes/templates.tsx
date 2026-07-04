import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
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

  useEffect(() => {
    void loadThemes() // 미리보기 렌더에 테마 필요
    api.listTemplates().then(setTemplates).catch(() => {})
  }, [loadThemes])

  const categories = useMemo(() => ['all', ...Array.from(new Set(templates.map((t) => t.category)))], [templates])
  const shown = cat === 'all' ? templates : templates.filter((t) => t.category === cat)

  const useTemplate = (t: TemplateMeta) => navigate({ to: '/create', search: { template: t.id } })

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-10 py-8">
        <h1 className="mb-1 text-2xl font-bold">템플릿 갤러리</h1>
        <p className="mb-5 text-muted-foreground">{templates.length}종 · 원하는 디자인을 고르면 AI가 그 스타일로 채웁니다.</p>

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
            <TemplateCard key={t.id} template={t} onPreview={(tt, deck) => setPreview({ template: tt, deck })} onUse={useTemplate} />
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

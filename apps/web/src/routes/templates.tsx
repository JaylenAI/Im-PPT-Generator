import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Layers } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { api } from '@/lib/api'
import type { TemplateMeta } from '@im-ppt/schema'

export const Route = createFileRoute('/templates')({
  component: TemplatesPage,
})

const CATEGORY_LABEL: Record<string, string> = {
  business: '비즈니스', education: '교육', creative: '크리에이티브', tech: '테크', minimal: '미니멀',
}

function TemplatesPage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<TemplateMeta[]>([])

  useEffect(() => {
    api.listTemplates().then(setTemplates).catch(() => {})
  }, [])

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-10 py-8">
        <h1 className="mb-2 text-2xl font-bold">템플릿 갤러리</h1>
        <p className="mb-6 text-muted-foreground">원하는 양식을 골라 바로 시작하세요.</p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-primary">
                <Layers className="h-6 w-6" />
              </div>
              <div className="text-lg font-bold">{t.name}</div>
              <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-secondary px-2 py-0.5">{CATEGORY_LABEL[t.category] ?? t.category}</span>
                <span className="rounded bg-secondary px-2 py-0.5">{t.aspectRatios.join(', ')}</span>
                <span className="rounded bg-secondary px-2 py-0.5">레이아웃 {t.layoutTypes.length}</span>
              </div>
              <button
                onClick={() => navigate({ to: '/create' })}
                className="mt-5 w-full rounded-xl bg-gradient-brand py-2.5 text-sm font-semibold text-white shadow-brand"
              >
                이 템플릿으로 만들기
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

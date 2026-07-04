import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Search, Sparkles, FileUp, LayoutTemplate, ArrowRight } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { SlideThumbnail } from '@/components/slides/SlideThumbnail'
import { useAppStore } from '@/lib/store'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

const CREATE_CARDS = [
  { to: '/create', icon: Sparkles, title: 'AI 프롬프트 → PPT', desc: '주제를 입력하면 AI가 완성된 프레젠테이션을 생성합니다.' },
  { to: '/create', icon: FileUp, title: '파일·데이터로 변환', desc: '문서(PDF·DOCX·TXT·MD)나 CSV 데이터를 슬라이드로 변환합니다.' },
  { to: '/templates', icon: LayoutTemplate, title: '템플릿에서 시작', desc: '16종 디자인을 미리보고 골라 AI가 그 스타일로 채웁니다.' },
] as const

function Dashboard() {
  const decks = useAppStore((s) => s.decks)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const searching = q.length > 0
  const shown = searching ? decks.filter((d) => (d.title ?? '').toLowerCase().includes(q)) : decks.slice(0, 4)

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-10 py-8">
        <header className="mb-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="내 프레젠테이션 제목 검색..."
              className="w-full rounded-full border border-border bg-secondary/60 py-3 pl-12 pr-4 text-sm outline-none transition-colors focus:border-primary focus:bg-card"
            />
          </div>
        </header>

        {!searching && (
          <section>
            <h1 className="mb-5 text-2xl font-bold">새로 만들기</h1>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {CREATE_CARDS.map((c) => (
                <Link
                  key={c.title}
                  to={c.to}
                  className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-card"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-primary">
                    <c.icon className="h-6 w-6" />
                  </div>
                  <div className="mb-2 flex items-center gap-2 text-lg font-bold">
                    {c.title}
                    <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className={searching ? '' : 'mt-12'}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">{searching ? `검색 결과 (${shown.length})` : '최근 프레젠테이션'}</h2>
            {!searching && (
              <Link to="/recent" className="text-sm font-semibold text-primary hover:underline">전체 보기</Link>
            )}
          </div>

          {shown.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              {searching ? '검색 결과가 없습니다.' : '아직 프레젠테이션이 없습니다. 첫 번째를 만들어보세요!'}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {shown.map((d) => (
                <button
                  key={d.id}
                  onClick={() => navigate({ to: '/editor/$id', params: { id: d.id } })}
                  className="group text-left"
                >
                  <div className="aspect-video overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all group-hover:-translate-y-1 group-hover:shadow-card">
                    <SlideThumbnail deck={d} />
                  </div>
                  <div className="mt-3 font-semibold">{d.title}</div>
                  <div className="text-sm text-muted-foreground">{d.slides.length}장</div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}

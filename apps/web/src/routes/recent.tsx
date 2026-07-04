import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { AppShell } from '@/components/AppShell'
import { SlideThumbnail } from '@/components/slides/SlideThumbnail'
import { useAppStore } from '@/lib/store'

export const Route = createFileRoute('/recent')({
  component: RecentPage,
})

function RecentPage() {
  const decks = useAppStore((s) => s.decks)
  const navigate = useNavigate()

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-10 py-8">
        <h1 className="mb-6 text-2xl font-bold">최근 프레젠테이션</h1>
        {decks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            아직 없습니다.{' '}
            <Link to="/create" className="font-semibold text-primary hover:underline">첫 프레젠테이션 만들기</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {decks.map((d) => (
              <button key={d.id} onClick={() => navigate({ to: '/editor/$id', params: { id: d.id } })} className="group text-left">
                <div className="aspect-video overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all group-hover:-translate-y-1 group-hover:shadow-card">
                  <SlideThumbnail deck={d} />
                </div>
                <div className="mt-3 font-semibold">{d.title}</div>
                <div className="text-sm text-muted-foreground">{d.slides.length}장</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}

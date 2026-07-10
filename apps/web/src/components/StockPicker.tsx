import { useEffect, useState } from 'react'
import { Search, Loader2, X } from 'lucide-react'
import { api, type StockPhoto } from '@/lib/api'

/**
 * 스톡 이미지 피커(P12) — 검색 → 그리드 → 클릭 삽입. 선택 시 원본을 data URI로 받아 삽입.
 * 키 미설정(available=false)이면 안내만 표시(에디터가 버튼을 계속 노출해도 무해).
 */
export function StockPicker({
  initialQuery,
  onInsert,
  onClose,
}: {
  initialQuery: string
  onInsert: (dataUri: string, alt: string) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState(initialQuery)
  const [photos, setPhotos] = useState<StockPhoto[]>([])
  const [available, setAvailable] = useState(true)
  const [provider, setProvider] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [inserting, setInserting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async (q: string) => {
    const term = q.trim()
    if (!term) return
    setLoading(true); setError(null)
    try {
      const res = await api.searchStock(term)
      setAvailable(res.available)
      setProvider(res.provider)
      setPhotos(res.photos)
    } catch (e) { setError((e as Error).message) } finally { setLoading(false) }
  }

  useEffect(() => { void run(initialQuery) }, [initialQuery])

  const insert = async (photo: StockPhoto) => {
    setInserting(photo.id); setError(null)
    try {
      const { dataUri } = await api.fetchStockDataUri(photo.url)
      onInsert(dataUri, photo.alt)
    } catch (e) { setError((e as Error).message) } finally { setInserting(null) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card"
        onClick={(e) => e.stopPropagation()}
        data-testid="stock-picker"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="font-semibold">스톡 이미지{provider ? ` · ${provider}` : ''}</h2>
          <button onClick={onClose} aria-label="닫기" className="rounded-md p-1 hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex gap-2 border-b border-border p-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void run(query) }}
              placeholder="검색어(영어 권장): ocean, city night, teamwork…"
              data-testid="stock-search"
              className="flex-1 bg-transparent py-2 text-sm outline-none"
            />
          </div>
          <button onClick={() => void run(query)} disabled={loading || !query.trim()}
            className="flex items-center gap-2 rounded-lg bg-gradient-brand px-4 text-sm font-semibold text-white disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} 검색
          </button>
        </div>

        {error && <p className="px-5 py-2 text-sm text-destructive">{error}</p>}

        <div className="flex-1 overflow-y-auto p-4">
          {!available ? (
            <div className="py-12 text-center text-sm text-muted-foreground" data-testid="stock-unavailable">
              스톡 이미지 API 키가 설정되지 않았습니다.<br />
              서버 환경변수 <code className="rounded bg-secondary px-1">PEXELS_API_KEY</code> 또는{' '}
              <code className="rounded bg-secondary px-1">UNSPLASH_ACCESS_KEY</code>를 설정하면 실사진을 검색할 수 있습니다.
            </div>
          ) : loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : photos.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => void insert(p)}
                  disabled={inserting !== null}
                  data-testid="stock-photo"
                  className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border disabled:opacity-60"
                  title={`${p.alt} — ${p.author}`}
                >
                  <img src={p.thumbUrl} alt={p.alt} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  {inserting === p.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  )}
                  <span className="absolute bottom-0 left-0 right-0 truncate bg-black/50 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">
                    © {p.author}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

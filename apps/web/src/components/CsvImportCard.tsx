import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { BarChart3, Loader2, ChevronDown } from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/store'

const CHART_TYPES: Array<{ value: string; label: string }> = [
  { value: 'bar', label: '막대' },
  { value: 'line', label: '선' },
  { value: 'area', label: '영역' },
  { value: 'pie', label: '원형' },
  { value: 'donut', label: '도넛' },
]
const SAMPLE = '분기,매출\nQ1,120\nQ2,150\nQ3,210\nQ4,340'

/**
 * CSV → 차트 덱(P7 UI) — 데이터를 붙여넣으면 차트 슬라이드 덱을 즉시 생성.
 * 생성 위저드의 보조 경로(AI 생성과 별개, LLM 없이 데이터만으로).
 */
export function CsvImportCard() {
  const navigate = useNavigate()
  const addDeck = useAppStore((s) => s.addDeck)
  const [open, setOpen] = useState(false)
  const [csv, setCsv] = useState('')
  const [title, setTitle] = useState('')
  const [chartType, setChartType] = useState('bar')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const make = async () => {
    if (!csv.trim() || busy) return
    setBusy(true); setErr(null)
    try {
      const r = await api.deckFromCsv(csv.trim(), title.trim() || undefined, chartType)
      addDeck(r.deck)
      navigate({ to: '/editor/$id', params: { id: r.deckId } })
    } catch (e) { setErr((e as Error).message); setBusy(false) }
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card shadow-card" data-testid="csv-card">
      <button onClick={() => setOpen((o) => !o)} data-testid="csv-toggle"
        className="flex w-full items-center gap-2 p-4 text-left text-sm font-medium">
        <BarChart3 className="h-4 w-4 text-primary" />
        데이터(CSV)로 차트 덱 만들기
        <span className="ml-auto text-xs text-muted-foreground">AI 없이 즉시</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-border p-4">
          <textarea
            rows={5} value={csv} onChange={(e) => setCsv(e.target.value)}
            placeholder={`CSV 붙여넣기 (첫 줄=헤더)\n예:\n${SAMPLE}`}
            data-testid="csv-input"
            className="w-full resize-none rounded-xl border border-border bg-background p-3 font-mono text-xs outline-none focus:border-primary"
          />
          <div className="mt-2 flex items-center gap-2">
            <button onClick={() => setCsv(SAMPLE)} className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary">예시 넣기</button>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목(선택)"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary" />
            <select value={chartType} onChange={(e) => setChartType(e.target.value)} data-testid="csv-charttype"
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm">
              {CHART_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
          <button onClick={make} disabled={!csv.trim() || busy} data-testid="csv-make"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-2.5 text-sm font-semibold text-white shadow-brand disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />} 차트 덱 만들기
          </button>
        </div>
      )}
    </div>
  )
}

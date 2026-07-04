import { useEffect, useState } from 'react'
import type { Deck, Theme } from '@im-ppt/schema'
import { api, type GenerateInput } from './lib/api.js'
import { DeckViewer } from './DeckViewer.js'

type View = { step: 'create' } | { step: 'generating' } | { step: 'viewer'; deck: Deck; theme: Theme }
type Preset = NonNullable<GenerateInput['preset']>

const PRESETS: Array<{ id: Preset; label: string; desc: string }> = [
  { id: 'quick', label: '빠르게', desc: '리서치·승인 없이 자동' },
  { id: 'standard', label: '표준', desc: '목차 승인' },
  { id: 'research', label: '리서치', desc: '딥서치+팩트 승인' },
]

const EXAMPLES = ['AI 도입 전략 제안', '2026 시장 동향 분석', '신제품 출시 피치덱']

export function App() {
  const [view, setView] = useState<View>({ step: 'create' })
  const [prompt, setPrompt] = useState('')
  const [preset, setPreset] = useState<Preset>('quick')
  const [slideCount, setSlideCount] = useState(8)
  const [themes, setThemes] = useState<Theme[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.listThemes().then(setThemes).catch(() => setThemes([]))
  }, [])

  const generate = async () => {
    if (!prompt.trim()) return
    setView({ step: 'generating' })
    setError(null)
    try {
      const { deck } = await api.generateDeck({ prompt: prompt.trim(), preset, slideCount, language: '한국어' })
      const theme = themes.find((t) => t.id === deck.themeId) ?? (await api.listThemes()).find((t) => t.id === deck.themeId)
      if (!theme) throw new Error('테마를 불러오지 못했습니다')
      setView({ step: 'viewer', deck, theme })
    } catch (e) {
      setError((e as Error).message)
      setView({ step: 'create' })
    }
  }

  if (view.step === 'viewer') {
    return <DeckViewer deck={view.deck} theme={view.theme} onBack={() => { setView({ step: 'create' }); setPrompt('') }} />
  }

  if (view.step === 'generating') {
    return (
      <div className="shell" style={{ textAlign: 'center', paddingTop: 120 }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p className="ai-pulse" style={{ marginTop: 20 }}>
          AI가 프레젠테이션을 설계하고 있습니다…
        </p>
        <p className="muted">아웃라인 생성 후 슬라이드를 병렬로 만듭니다 (약 1~2분)</p>
      </div>
    )
  }

  return (
    <div className="shell">
      <h1 className="title">무엇을 만들까요?</h1>
      <p className="subtitle">주제를 입력하면 AI가 아웃라인을 짜고 슬라이드를 생성합니다.</p>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <div className="card" style={{ marginTop: 24 }}>
        <textarea
          rows={3}
          placeholder="예: 중소기업을 위한 클라우드 전환 전략, 임원 대상, 15장"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="row" style={{ marginTop: 10 }}>
          {EXAMPLES.map((ex) => (
            <button key={ex} className="btn" style={{ fontSize: 13, padding: '6px 12px' }} onClick={() => setPrompt(ex)}>
              {ex}
            </button>
          ))}
        </div>

        <div className="row" style={{ marginTop: 20, gap: 10 }}>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              className={`btn ${preset === p.id ? 'btn-primary' : ''}`}
              onClick={() => setPreset(p.id)}
              title={p.desc}
            >
              {p.label}
            </button>
          ))}
          <label className="row" style={{ gap: 6 }}>
            <span className="muted">슬라이드</span>
            <input
              type="number"
              min={3}
              max={30}
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              style={{ width: 72 }}
            />
          </label>
        </div>

        <div style={{ marginTop: 20 }}>
          <button className="btn btn-ai" onClick={generate} disabled={!prompt.trim()}>
            ✨ 프레젠테이션 생성
          </button>
        </div>
      </div>
    </div>
  )
}

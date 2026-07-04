import { useEffect, useState } from 'react'
import { api, type ModelConnectionView, type PromptView } from './lib/api.js'

/** AI 설정 화면 — 모델 연결(마스킹)·프롬프트 카탈로그 편집. /settings API를 소비만(ADR-007) */
export function SettingsView({ onBack }: { onBack: () => void }) {
  const [models, setModels] = useState<ModelConnectionView[]>([])
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [prompts, setPrompts] = useState<PromptView[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    api.getModels().then((d) => { setModels(d.connections); setAssignments(d.assignments) }).catch((e) => setError((e as Error).message))
    api.getPrompts().then(setPrompts).catch((e) => setError((e as Error).message))
  }
  useEffect(load, [])

  return (
    <div className="shell">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
        <button className="btn" onClick={onBack}>← 돌아가기</button>
        <span className="ai-pulse">AI 설정</span>
      </div>
      <h1 className="title">AI 설정</h1>
      <p className="subtitle">모델 연결과 프롬프트를 자유롭게 커스터마이징합니다.</p>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <h2 style={{ marginTop: 28 }}>모델 연결</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {models.map((m) => (
          <div className="card" key={m.id}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <strong>{m.name}</strong>
                <span className="muted"> · {m.provider} · {m.model}</span>
              </div>
              <span className="muted">{m.isActive ? '🟢 활성' : '⚪ 비활성'}</span>
            </div>
            <div className="muted" style={{ marginTop: 6 }}>
              담당 작업: {m.tags.join(', ')}
              {m.apiKey ? ` · 키: ${m.apiKey}` : ' · 구독 기반(키 불필요)'}
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 32 }}>프롬프트 ({prompts.length})</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {prompts.map((p) => (
          <PromptEditor key={p.key} prompt={p} onSaved={load} />
        ))}
      </div>
    </div>
  )
}

function PromptEditor({ prompt, onSaved }: { prompt: PromptView; onSaved: () => void }) {
  const [content, setContent] = useState(prompt.currentContent)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => setContent(prompt.currentContent), [prompt.currentContent])

  const save = async () => {
    setSaving(true)
    try {
      await api.patchPrompt(prompt.key, content)
      onSaved()
    } finally {
      setSaving(false)
    }
  }
  const reset = async () => {
    setSaving(true)
    try {
      await api.patchPrompt(prompt.key, '') // 빈 문자열 = 기본값 복귀
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <div>
          <strong>{prompt.key}</strong>
          {prompt.isOverridden && <span className="muted"> · ✏️ 수정됨</span>}
          <div className="muted">{prompt.description}</div>
        </div>
        <span className="muted">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ marginTop: 12 }}>
          <div className="muted" style={{ marginBottom: 6 }}>변수: {prompt.variables.map((v) => `{${v}}`).join(' ')}</div>
          <textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} style={{ fontFamily: 'monospace', fontSize: 13 }} />
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn btn-primary" onClick={save} disabled={saving}>저장</button>
            {prompt.isOverridden && <button className="btn" onClick={reset} disabled={saving}>기본값 복귀</button>}
          </div>
        </div>
      )}
    </div>
  )
}

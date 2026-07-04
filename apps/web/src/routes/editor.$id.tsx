import { useCallback, useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Sparkles, Send, Download, Play, ChevronLeft, MessageSquare, Search as SearchIcon, Loader2,
  Pencil, Check as CheckIcon, Undo2, Redo2, Copy, Type as TypeIcon, Image as ImageIcon, Square, Share2, ListChecks, Stethoscope,
} from 'lucide-react'
import type { Deck, Theme } from '@im-ppt/schema'
import { CANVAS_SIZES } from '@im-ppt/schema'
import { SlideView, ScaledSlide, type EditHandlers } from '@im-ppt/renderer'
import { AppSidebar } from '@/components/AppSidebar'
import { PropertyPanel } from '@/components/PropertyPanel'
import { PresentMode } from '@/components/PresentMode'
import { GhostDeckView } from '@/components/GhostDeckView'
import { DeckDoctorView } from '@/components/DeckDoctorView'
import { AiToolsMenu } from '@/components/AiToolsMenu'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { editText, editListItem, updateFrame, updateTextStyle, deleteElement, addElement, newElement, reorderElement } from '@/lib/deck-edit'
import { makeId, type ChatMessage } from '@/lib/types'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/editor/$id')({
  component: EditorPage,
})

/**
 * 콜백 ref로 너비 측정 — 노드가 실제로 마운트될 때 ResizeObserver를 부착한다.
 * (useRef+useEffect는 마운트 시 노드가 로딩 UI라 null이면 관찰을 놓침 → 직접 URL/새로고침 시
 * 캔버스가 안 그려지던 버그. 콜백 ref는 대상 div가 나타나는 시점에 정확히 실행됨)
 */
function useWidth<T extends HTMLElement>() {
  const [w, setW] = useState(0)
  const roRef = useRef<ResizeObserver | null>(null)
  const ref = useCallback((el: T | null) => {
    roRef.current?.disconnect()
    if (!el) return
    const ro = new ResizeObserver(([e]) => e && setW(e.contentRect.width))
    ro.observe(el)
    roRef.current = ro
  }, [])
  return { ref, width: w }
}

function EditorPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const storeDeck = useAppStore((s) => s.getDeck(id))
  const themeFor = useAppStore((s) => s.themeFor)
  const loadThemes = useAppStore((s) => s.loadThemes)
  const addDeck = useAppStore((s) => s.addDeck)

  const [deck, setDeck] = useState<Deck | undefined>(storeDeck)
  const deckRef = useRef<Deck | undefined>(storeDeck)
  const [theme, setTheme] = useState<Theme | undefined>(storeDeck ? themeFor(storeDeck) : undefined)
  const [active, setActive] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [tab, setTab] = useState<'chat' | 'search'>('chat')
  const [editing, setEditing] = useState(false)
  // WYSIWYG 편집 상태
  const [editMode, setEditMode] = useState(false)
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const [imgGen, setImgGen] = useState(false)
  const [ghostOpen, setGhostOpen] = useState(false)
  const [doctorOpen, setDoctorOpen] = useState(false)
  // undo/redo 히스토리
  const [hist, setHist] = useState<{ stack: Deck[]; idx: number }>({ stack: [], idx: -1 })
  const { ref, width } = useWidth<HTMLDivElement>()

  // 스토어에 없으면(새로고침/직접 URL) 백엔드에서 로드
  useEffect(() => {
    let alive = true
    ;(async () => {
      const themes = await loadThemes()
      let d = storeDeck
      if (!d) {
        try {
          d = await api.getDeck(id)
          if (alive && d) addDeck(d)
        } catch {
          /* not found */
        }
      }
      if (alive && d) {
        setDeck(d)
        deckRef.current = d
        setTheme(themes.find((t) => t.id === d!.themeId))
        setHist({ stack: [d], idx: 0 }) // 히스토리 시작점
      }
    })()
    return () => { alive = false }
  }, [id])

  if (!deck || !theme) {
    return (
      <div className="flex h-screen items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> 불러오는 중…
      </div>
    )
  }

  const slide = deck.slides[active] ?? deck.slides[0]

  const download = async () => {
    setDownloading(true)
    try {
      const { exportId } = await api.createExport(deck.id)
      window.location.href = api.downloadUrl(exportId)
    } finally {
      setDownloading(false)
    }
  }

  // 편집 커밋 — 덱 갱신 + 히스토리 push + dirty
  const commit = (newDeck: Deck) => {
    setDeck(newDeck)
    deckRef.current = newDeck
    setHist((h) => {
      const stack = [...h.stack.slice(0, h.idx + 1), newDeck]
      return { stack, idx: stack.length - 1 }
    })
    setDirty(true)
  }
  // 드래그 중 라이브 갱신(히스토리 미기록) — deckRef로 최신 유지
  const liveUpdate = (fn: (d: Deck) => Deck) => {
    setDeck((d) => {
      if (!d) return d
      const next = fn(d)
      deckRef.current = next
      return next
    })
    setDirty(true)
  }
  // 드래그 종료 — 현재 덱을 히스토리에 커밋
  const commitCurrent = () => {
    const d = deckRef.current
    if (!d) return
    setHist((h) => {
      const stack = [...h.stack.slice(0, h.idx + 1), d]
      return { stack, idx: stack.length - 1 }
    })
  }
  const undo = () =>
    setHist((h) => {
      if (h.idx <= 0) return h
      const idx = h.idx - 1
      setDeck(h.stack[idx]!)
      setDirty(true)
      return { ...h, idx }
    })
  const redo = () =>
    setHist((h) => {
      if (h.idx >= h.stack.length - 1) return h
      const idx = h.idx + 1
      setDeck(h.stack[idx]!)
      setDirty(true)
      return { ...h, idx }
    })
  const canUndo = hist.idx > 0
  const canRedo = hist.idx < hist.stack.length - 1

  const canvasW = deck ? CANVAS_SIZES[deck.aspectRatio].width : 1280
  const scale = width > 0 ? width / canvasW : 1

  // WYSIWYG — 인라인 편집 + 드래그/리사이즈 핸들러
  const editHandlers: EditHandlers | undefined =
    editMode && slide
      ? {
          ...(selectedId ? { selectedId } : {}),
          scale,
          onSelect: (elId: string) => setSelectedId(elId),
          onEditText: (elId: string, content: string) => deck && commit(editText(deck, slide.id, elId, content)),
          onEditListItem: (elId: string, index: number, text: string) =>
            deck && commit(editListItem(deck, slide.id, elId, index, text)),
          onMoveLive: (elId: string, pos: { x: number; y: number }) =>
            liveUpdate((d) => updateFrame(d, slide.id, elId, pos)),
          onResizeLive: (elId: string, size: { w: number; h: number }) =>
            liveUpdate((d) => updateFrame(d, slide.id, elId, size)),
          onDragEnd: commitCurrent,
        }
      : undefined

  const selectedEl = slide?.elements.find((e) => e.id === selectedId)

  const save = async () => {
    if (!deck || !dirty) return
    setSaving(true)
    try {
      const updated = await api.updateDeck(deck.id, deck)
      setDeck(updated)
      addDeck(updated)
      setDirty(false)
    } catch {
      /* keep dirty on failure */
    } finally {
      setSaving(false)
    }
  }

  const send = async () => {
    if (!input.trim() || editing || !slide) return
    const text = input.trim()
    setInput('')
    setChat((c) => [...c, { id: makeId(), role: 'user', content: text, createdAt: Date.now() }])
    setEditing(true)
    try {
      const { deck: updated } = await api.regenerateSlide(deck.id, slide.id, text)
      setDeck(updated) // 해당 페이지만 바뀐 새 덱
      setChat((c) => [...c, { id: makeId(), role: 'assistant', content: `"${slide.layoutType}" 슬라이드를 수정했습니다.`, createdAt: Date.now() }])
    } catch (e) {
      setChat((c) => [...c, { id: makeId(), role: 'assistant', content: `수정 실패: ${(e as Error).message}`, createdAt: Date.now() }])
    } finally {
      setEditing(false)
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {presenting && (
        <PresentMode deck={deck} theme={theme} active={active} setActive={setActive} onExit={() => setPresenting(false)} />
      )}
      {ghostOpen && <GhostDeckView deckId={deck.id} onClose={() => setGhostOpen(false)} />}
      {doctorOpen && <DeckDoctorView deckId={deck.id} onClose={() => setDoctorOpen(false)} onFixed={commit} />}
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-6">
          <button onClick={() => navigate({ to: '/' })} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-display text-lg font-bold text-primary">{deck.title}</span>
          <div className="ml-auto flex items-center gap-2">
            {editMode && (
              <div className="flex items-center gap-1">
                <button onClick={undo} disabled={!canUndo} data-testid="undo-btn" aria-label="실행 취소"
                  className="rounded-lg border border-border p-1.5 hover:bg-secondary disabled:opacity-30">
                  <Undo2 className="h-4 w-4" />
                </button>
                <button onClick={redo} disabled={!canRedo} data-testid="redo-btn" aria-label="다시 실행"
                  className="rounded-lg border border-border p-1.5 hover:bg-secondary disabled:opacity-30">
                  <Redo2 className="h-4 w-4" />
                </button>
              </div>
            )}
            <button
              onClick={() => { setEditMode((e) => !e); setSelectedId(undefined) }}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium',
                editMode ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-secondary',
              )}
            >
              <Pencil className="h-4 w-4" /> {editMode ? '편집 중' : '편집'}
            </button>
            {dirty && (
              <button
                onClick={save}
                disabled={saving}
                data-testid="save-btn"
                className="flex items-center gap-1.5 rounded-lg bg-teal px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />} 저장
              </button>
            )}
            <button
              onClick={async () => {
                const { deck: copy } = await api.duplicateDeck(deck.id)
                addDeck(copy)
                navigate({ to: '/editor/$id', params: { id: copy.id } })
              }}
              data-testid="duplicate-btn"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
            >
              <Copy className="h-4 w-4" /> 복제
            </button>
            <button
              onClick={download}
              disabled={downloading}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary disabled:opacity-50"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} PPTX
            </button>
            <AiToolsMenu deck={deck} onDeckUpdate={commit} />
            <button onClick={() => setGhostOpen(true)} data-testid="ghost-btn"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary">
              <ListChecks className="h-4 w-4" /> 제목 점검
            </button>
            <button onClick={() => setDoctorOpen(true)} data-testid="doctor-btn"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary">
              <Stethoscope className="h-4 w-4" /> 품질 진단
            </button>
            <a href={`/share/${deck.id}`} target="_blank" rel="noreferrer" data-testid="share-btn"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary">
              <Share2 className="h-4 w-4" /> 공유
            </a>
            <button onClick={() => setPresenting(true)} data-testid="present-btn"
              className="flex items-center gap-1.5 rounded-lg bg-gradient-brand px-4 py-1.5 text-sm font-semibold text-white shadow-brand">
              <Play className="h-4 w-4" /> 발표
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Canvas + thumbnails */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden p-6">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-mono text-muted-foreground">슬라이드 {active + 1} / {deck.slides.length}</span>
                {editMode && slide && (
                  <div className="flex items-center gap-1" data-testid="add-toolbar">
                    <span className="mr-1 text-xs text-muted-foreground">추가</span>
                    <button data-testid="add-text" onClick={() => { const el = newElement('text'); commit(addElement(deck, slide.id, el)); setSelectedId(el.id) }}
                      className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:border-primary"><TypeIcon className="h-3.5 w-3.5" /> 텍스트</button>
                    <button data-testid="add-image" disabled={imgGen} onClick={async () => {
                      const concept = window.prompt('AI로 만들 이미지 설명(예: 상승 그래프 아이콘). 비우고 확인하면 URL 입력')
                      if (concept === null) return
                      if (concept.trim() === '') {
                        const url = window.prompt('이미지 URL')
                        if (!url) return
                        const el = newElement('image', { src: url }); commit(addElement(deck, slide.id, el)); setSelectedId(el.id)
                        return
                      }
                      setImgGen(true)
                      try {
                        const { dataUri } = await api.generateImage(concept.trim(), deck.themeId)
                        const el = newElement('image', { src: dataUri }); commit(addElement(deck, slide.id, el)); setSelectedId(el.id)
                      } finally { setImgGen(false) }
                    }} className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:border-primary disabled:opacity-50">
                      {imgGen ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />} 이미지</button>
                    <button data-testid="add-shape" onClick={() => { const el = newElement('shape'); commit(addElement(deck, slide.id, el)); setSelectedId(el.id) }}
                      className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:border-primary"><Square className="h-3.5 w-3.5" /> 도형</button>
                  </div>
                )}
                <span className="rounded-md bg-secondary px-2 py-1 font-mono text-xs">{deck.aspectRatio}</span>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <div
                  ref={ref}
                  data-testid="editor-canvas"
                  onClick={(e) => editMode && e.target === e.currentTarget && setSelectedId(undefined)}
                  className={cn(
                    'w-full max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-card',
                    editMode ? 'border-primary/50' : 'border-border',
                  )}
                >
                  {width > 0 && slide && (
                    <ScaledSlide width={width} aspectRatio={deck.aspectRatio}>
                      <SlideView
                        slide={slide}
                        theme={theme}
                        aspectRatio={deck.aspectRatio}
                        {...(editHandlers ? { edit: editHandlers } : {})}
                      />
                    </ScaledSlide>
                  )}
                </div>
                {editMode && (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    텍스트를 클릭해 바로 편집하세요. 변경 후 <b>저장</b>을 누르면 반영됩니다.
                  </p>
                )}
              </div>
            </div>

            {/* Thumbnail strip */}
            <div className="flex shrink-0 gap-3 overflow-x-auto border-t border-border bg-card/60 p-4">
              {deck.slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setActive(i)}
                  className={cn(
                    'relative block w-40 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                    i === active ? 'border-primary shadow-brand' : 'border-border hover:border-primary/40',
                  )}
                >
                  <ScaledSlide width={160} aspectRatio={deck.aspectRatio}>
                    <SlideView slide={s} theme={theme} aspectRatio={deck.aspectRatio} />
                  </ScaledSlide>
                  <span className="absolute left-1.5 top-1.5 rounded bg-black/50 px-1.5 font-mono text-[10px] text-white">{i + 1}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 우측 패널 — 요소 선택 시 속성 패널, 아니면 AI Copilot */}
          <aside className="flex w-[380px] shrink-0 flex-col border-l border-border bg-sidebar text-sidebar-foreground">
            {editMode && selectedEl && slide ? (
              <PropertyPanel
                element={selectedEl}
                onFrame={(patch) => deck && commit(updateFrame(deck, slide.id, selectedEl.id, patch))}
                onStyle={(patch) => deck && commit(updateTextStyle(deck, slide.id, selectedEl.id, patch))}
                onReorder={(dir) => deck && commit(reorderElement(deck, slide.id, selectedEl.id, dir))}
                onDelete={() => {
                  if (deck) commit(deleteElement(deck, slide.id, selectedEl.id))
                  setSelectedId(undefined)
                }}
              />
            ) : (
            <>
            <div className="border-b border-sidebar-border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-teal" /> AI COPILOT
              </div>
              <p className="mt-1 text-xs text-sidebar-foreground/60">"{slide?.layoutType}" 슬라이드 편집 — 무엇이든 물어보세요.</p>
              <div className="mt-3 flex gap-1 rounded-lg bg-sidebar-accent p-1">
                {([['chat', MessageSquare, '채팅'], ['search', SearchIcon, '딥서치']] as const).map(([k, Icon, label]) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium', tab === k ? 'bg-gradient-brand text-white' : 'text-sidebar-foreground/60')}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {chat.length === 0 && (
                <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-4 text-sm text-sidebar-foreground/70">
                  예: "이 슬라이드를 Gen Z 중심으로", "성장 통계 추가", "더 자신감 있는 톤으로" (P4에서 연결)
                </div>
              )}
              {chat.map((m) => (
                <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[85%] rounded-2xl px-4 py-3 text-sm', m.role === 'user' ? 'bg-gradient-brand text-white' : 'bg-sidebar-accent text-sidebar-foreground')}>
                    {m.content}
                  </div>
                </div>
              ))}
              {editing && (
                <div className="flex items-center gap-2 text-xs text-teal">
                  <span className="h-2 w-2 animate-ping rounded-full bg-teal" />
                  <span className="font-mono">이 페이지를 수정하고 있습니다…</span>
                </div>
              )}
            </div>

            <div className="border-t border-sidebar-border p-4">
              <div className="relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="예: 더 간결하게 / 통계 추가 / 톤 바꿔줘"
                  disabled={editing}
                  className="w-full rounded-xl border border-sidebar-border bg-sidebar-accent py-3 pl-4 pr-11 text-sm text-white outline-none placeholder:text-sidebar-foreground/40 focus:border-primary disabled:opacity-50"
                />
                <button onClick={send} disabled={!input.trim() || editing} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-gradient-brand p-2 text-white disabled:opacity-40">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
            </>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}

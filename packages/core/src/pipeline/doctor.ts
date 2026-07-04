import type { Deck, Slide, SlideElement } from '@im-ppt/schema'

/**
 * Deck Doctor — 생성된 덱을 프레젠테이션 베스트프랙티스로 스캔해 개선점을 진단(순수 함수).
 *
 * Ghost Deck(ADR-009)이 아웃라인 레벨 "제목만 읽어 논리가 통하나"를 본다면,
 * Doctor는 슬라이드 레벨 "각 장이 발표 보조물로 적절한가"를 본다:
 * 텍스트 과밀(6x6 규칙), 데이터 슬라이드 스토리 누락, 요소 과밀, 빈 슬라이드 등.
 * 목/추측 없이 덱 JSON에서 결정론적으로 판정 → 편집 게이트/품질 배지로 소비.
 */

export type DoctorSeverity = 'high' | 'medium' | 'low'

export interface SlideIssue {
  slideId: string
  slideIndex: number
  kind: string
  severity: DoctorSeverity
  message: string
  suggestion: string
}

export interface DeckDiagnosis {
  /** 0~100 품질 점수(이슈 심각도 가중 감점) */
  score: number
  slideCount: number
  issues: SlideIssue[]
  /** 이슈 없음 */
  clean: boolean
}

// 임계값 — 딥리서치(6x6 규칙·발표 보조물 원칙) 기반. 한 곳에 모아 조정 가능.
const MAX_BULLETS = 6
const WORDY_BULLET_CHARS = 42
const TEXT_WALL_CHARS = 220
const MAX_CONTENT_ELEMENTS = 8
const SEVERITY_PENALTY: Record<DoctorSeverity, number> = { high: 15, medium: 8, low: 3 }
// 빈 슬라이드 판정에서 제외할 레이아웃(본디 본문이 적은 장)
const SPARSE_OK_LAYOUTS = new Set(['title', 'closing', 'section', 'references', 'quote'])

/** 콘텐츠로 치는 요소(배경 장식용 shape/underline 제외) */
function isContentElement(el: SlideElement): boolean {
  if (el.type === 'shape' || el.type === 'icon') return false
  if (el.type === 'text') return el.content.trim().length > 0
  return true
}

function diagnoseSlide(slide: Slide, index: number): SlideIssue[] {
  const issues: SlideIssue[] = []
  const mk = (kind: string, severity: DoctorSeverity, message: string, suggestion: string) =>
    issues.push({ slideId: slide.id, slideIndex: index, kind, severity, message, suggestion })

  const lists = slide.elements.filter((e) => e.type === 'list')
  const texts = slide.elements.filter((e) => e.type === 'text')
  const charts = slide.elements.filter((e) => e.type === 'chart')

  // 1. 글머리 과다(6x6 규칙)
  for (const list of lists) {
    if (list.items.length > MAX_BULLETS) {
      mk('bullet-overload', 'medium', `글머리 항목이 ${list.items.length}개입니다`, `${MAX_BULLETS}개 이하로 줄이거나 슬라이드를 나누세요`)
    }
    const wordy = list.items.filter((it) => it.length > WORDY_BULLET_CHARS)
    if (wordy.length > 0) {
      mk('wordy-bullet', 'low', `너무 긴 글머리 항목 ${wordy.length}개(${WORDY_BULLET_CHARS}자 초과)`, '핵심 키워드 위주로 한 줄로 압축하세요')
    }
  }

  // 2. 텍스트 벽(본문 과밀)
  for (const t of texts) {
    if ((t.role === 'body' || t.role === 'caption') && t.content.length > TEXT_WALL_CHARS) {
      mk('text-wall', 'medium', `본문 텍스트가 ${t.content.length}자로 과밀합니다`, '슬라이드는 읽는 문서가 아닌 발표 보조물 — 요점만 남기세요')
      break // 슬라이드당 1회만 보고
    }
  }

  // 3. 데이터 슬라이드 스토리 누락 — 차트에 강조도 인사이트도 없음
  for (const chart of charts) {
    const hasHighlight = chart.options.highlightIndex !== undefined
    const hasInsight = texts.some((t) => t.id === 'chart-insight' && t.content.trim().length > 0)
    if (!hasHighlight && !hasInsight) {
      mk('chart-no-story', 'medium', '차트에 핵심 메시지(insight)도 강조(highlight)도 없습니다', '가장 중요한 데이터 포인트를 강조하고 "그래서 무엇을 말하는가"를 한 줄로 다세요')
    }
  }

  // 4. 요소 과밀
  const contentCount = slide.elements.filter(isContentElement).length
  if (contentCount > MAX_CONTENT_ELEMENTS) {
    mk('overcrowded', 'low', `콘텐츠 요소가 ${contentCount}개로 많습니다`, '한 슬라이드=한 메시지 원칙으로 정리하세요')
  }

  // 5. 빈 슬라이드 — 제목 외 콘텐츠가 없음(본문 적은 레이아웃 제외)
  if (!SPARSE_OK_LAYOUTS.has(slide.layoutType)) {
    const nonTitleContent = slide.elements.some(
      (e) =>
        (e.type === 'text' && e.role !== 'title' && e.role !== 'display' && e.content.trim().length > 0) ||
        e.type === 'list' ||
        e.type === 'chart' ||
        e.type === 'table' ||
        e.type === 'image',
    )
    if (!nonTitleContent) {
      mk('empty', 'medium', '제목 외 내용이 비어 있습니다', '핵심 근거·데이터·요점을 추가하세요')
    }
  }

  return issues
}

/** 덱 전체 진단 — 이슈 목록 + 심각도 가중 점수(0~100) */
export function diagnoseDeck(deck: Deck): DeckDiagnosis {
  const issues = deck.slides.flatMap((s, i) => diagnoseSlide(s, i))
  const penalty = issues.reduce((sum, it) => sum + SEVERITY_PENALTY[it.severity], 0)
  const score = Math.max(0, 100 - penalty)
  return { score, slideCount: deck.slides.length, issues, clean: issues.length === 0 }
}

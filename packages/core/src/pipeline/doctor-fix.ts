import type { Deck } from '@im-ppt/schema'
import { diagnoseDeck, type SlideIssue, type DeckDiagnosis } from './doctor.js'
import { editSlide, replaceSlide } from './edit.js'
import type { SlideDeps } from './slide.js'

/**
 * Deck Doctor 자동 수정 — 진단(ADR-012) 결과를 editSlide 지시로 번역해 슬라이드를 개선.
 * 생성→진단→**개선**의 마지막 고리. 기존 editSlide/replaceSlide를 재사용(새 LLM 경로 없음).
 * overcrowded(요소 재배치)처럼 콘텐츠 재작성으로 안전하게 못 고치는 이슈는 대상에서 제외.
 */

/** 이슈 종류 → editSlide 수정 지시 문구(중복 제거) */
function fixInstruction(issues: SlideIssue[]): string {
  const parts = new Set<string>()
  for (const it of issues) {
    switch (it.kind) {
      case 'bullet-overload':
        parts.add('글머리 항목을 가장 중요한 6개 이하로 추려서 줄이세요.')
        break
      case 'wordy-bullet':
        parts.add('긴 글머리 항목을 핵심 키워드 위주로 한 줄로 압축하세요.')
        break
      case 'text-wall':
        parts.add('본문 텍스트를 요점만 남기고 대폭 줄이세요(슬라이드는 발표 보조물).')
        break
      case 'chart-no-story':
        parts.add(
          '차트에서 가장 중요한 데이터 포인트를 highlightIndex로 강조하고, 그 차트의 핵심 메시지를 insight 한 문장으로 다세요.',
        )
        break
      case 'empty':
        parts.add('제목에 맞는 핵심 근거·요점을 실제 내용으로 채우세요.')
        break
      // overcrowded: 요소 재배치 필요 → 자동 수정 제외
    }
  }
  return [...parts].join(' ')
}

/** 이 이슈가 자동 수정 대상인지 */
function isFixable(kind: string): boolean {
  return kind !== 'overcrowded'
}

export interface AutoFixResult {
  deck: Deck
  before: DeckDiagnosis
  after: DeckDiagnosis
  /** 실제로 수정 시도해 성공한 슬라이드 수 */
  fixedSlides: number
  costUsd: number
}

/**
 * 진단 → 슬라이드별 수정 지시 → editSlide로 개선 → 개선된 덱 반환.
 * 개별 슬라이드 수정 실패는 건너뛰고 계속(부분 개선 허용). 호출측이 반환 덱을 저장.
 */
export async function autoFixDeck(deck: Deck, deps: SlideDeps): Promise<AutoFixResult> {
  const before = diagnoseDeck(deck)

  // 슬라이드별로 수정 가능한 이슈 그룹핑
  const bySlide = new Map<string, SlideIssue[]>()
  for (const it of before.issues) {
    if (!isFixable(it.kind)) continue
    const arr = bySlide.get(it.slideId) ?? []
    arr.push(it)
    bySlide.set(it.slideId, arr)
  }

  let working = deck
  let cost = 0
  let fixed = 0
  for (const [slideId, issues] of bySlide) {
    const instruction = fixInstruction(issues)
    if (!instruction) continue
    try {
      const { slide, usage } = await editSlide({ deck: working, slideId, instruction, deps })
      working = replaceSlide(working, slide)
      cost += usage?.costUsd ?? 0
      fixed += 1
    } catch {
      // 부분 개선 허용 — 실패 슬라이드는 원본 유지
    }
  }

  return { deck: working, before, after: diagnoseDeck(working), fixedSlides: fixed, costUsd: cost }
}

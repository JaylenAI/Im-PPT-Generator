import type { Outline } from '@im-ppt/schema'

export interface GhostDeckIssue {
  sectionId: string
  index: number
  kind: 'missing-assertion' | 'label-not-sentence' | 'duplicate'
  detail: string
}

export interface GhostDeckReport {
  /** 순서대로의 헤드라인(assertion 우선, 없으면 title) — "제목만 읽기" 뷰 */
  titles: string[]
  issues: GhostDeckIssue[]
  /** 이슈 없으면 논리 골격 통과 */
  coherent: boolean
}

/** 라벨형(주장 아님) 감지 — 너무 짧거나 서술어가 없어 보이는 헤드라인 */
function looksLikeLabel(text: string): boolean {
  const t = text.trim()
  if (t.length < 8) return true
  // 결론 문장은 보통 동사/서술어로 끝남. 순수 명사구 라벨은 조사/서술어가 약함.
  // 한국어: 흔한 문장 종결(다/까/음/함/됨/…) 또는 마침표. 영어: 마침표 또는 동사 존재 근사.
  const sentenceEnding = /[.!?。]$|(다|까|음|함|됨|된다|한다|난다|진다|이다|되다)\.?$/
  return !sentenceEnding.test(t)
}

/**
 * Ghost Deck / Titles Test(ADR-009) — assertion만 순서대로 읽어 논리 골격을 점검.
 * 순수 함수(LLM 없음). "제목만 읽어도 통하는가"를 구조적으로 검증한다.
 */
export function checkGhostDeck(outline: Outline): GhostDeckReport {
  const issues: GhostDeckIssue[] = []
  const titles: string[] = []
  const seen = new Map<string, number>()

  outline.sections.forEach((s, index) => {
    const assertion = s.assertion ?? ''
    const headline = (assertion || s.title).trim()
    titles.push(headline)

    if (!assertion.trim()) {
      issues.push({ sectionId: s.id, index, kind: 'missing-assertion', detail: 'assertion(결론 문장)이 없습니다' })
    } else if (looksLikeLabel(assertion)) {
      issues.push({
        sectionId: s.id, index, kind: 'label-not-sentence',
        detail: `"${headline}" — 주제 라벨로 보입니다(완결된 결론 문장 권장)`,
      })
    }
    const key = headline.toLowerCase()
    if (seen.has(key)) {
      issues.push({ sectionId: s.id, index, kind: 'duplicate', detail: `${seen.get(key)! + 1}번째 제목과 중복` })
    } else {
      seen.set(key, index)
    }
  })

  return { titles, issues, coherent: issues.length === 0 }
}

import type { ZodType } from 'zod'
import type { Fact, ResearchMode, Source, UserSourceInput } from '@im-ppt/schema'

export type { UserSourceInput }

/**
 * 구조화 LLM 콜백 — research는 leaf 패키지(core 미의존)라 LLM을 주입받는다.
 * core/api가 자신의 ProviderRegistry를 이 형태로 바인딩해 넘긴다.
 */
export type StructuredLlm = <T>(
  prompt: string,
  schema: ZodType<T>,
) => Promise<{ data: T; usage?: { costUsd?: number } }>

/** 검색 결과(어댑터 공통) */
export interface SearchResult {
  title: string
  url: string
  snippet: string
  publisher?: string
}

/** 웹 검색 어댑터 — Tavily/Serper 등. 키·fetch는 생성 시 주입(테스트 가능) */
export interface SearchAdapter {
  readonly name: string
  search(query: string, opts?: { maxResults?: number }): Promise<SearchResult[]>
}

export interface ResearchInput {
  topic: string
  researchMode: ResearchMode
  userSources?: UserSourceInput[]
  /** 웹 검색 시 가져올 소스 수 */
  maxResults?: number
}

export interface ResearchDeps {
  llm: StructuredLlm
  /** 팩트 추출 프롬프트(core 카탈로그에서 해석된 문자열, {sources}/{topic} 치환됨) */
  buildFactPrompt: (args: { topic: string; sourcesText: string; language: string }) => string
  language: string
  /** 웹/딥 모드에서 사용할 검색 어댑터(없으면 웹 검색 스킵) */
  search?: SearchAdapter
  /** URL 본문 가져오기(기본: 내장 fetchUrl). 테스트에서 주입 가능 */
  fetchImpl?: typeof fetch
}

export interface ResearchResult {
  sources: Source[]
  facts: Fact[]
}

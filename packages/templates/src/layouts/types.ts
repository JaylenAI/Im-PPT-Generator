import { z } from 'zod'
import type { SlideBackground, SlideElement } from '@im-ppt/schema'

export interface LayoutContext {
  /** 가상 캔버스 크기 — P1은 16:9(1280×720)만, 비율 확장은 P9 */
  canvas: { width: number; height: number }
}

export interface LayoutResult {
  background?: SlideBackground
  elements: SlideElement[]
}

/**
 * 레이아웃 변형 정의 (ADR-002: 레이아웃=코드, AI는 선택+콘텐츠만).
 * - contentSchema: LLM 출력 계약 — 이 스키마를 통과한 콘텐츠만 build에 도달
 * - description: LLM에게 제공되는 선택 가이드(언제 이 레이아웃을 쓰는지)
 * - build: 좌표/타이포 배치의 유일한 소유자. 순수 함수(뮤테이션 금지)
 */
export interface LayoutDefinition<S extends z.ZodType = z.ZodType> {
  key: string
  name: string
  description: string
  contentSchema: S
  build: (content: z.infer<S>, ctx: LayoutContext) => LayoutResult
}

/**
 * 타입 소거된 런타임 레이아웃 — 레지스트리 저장 단위.
 * build 진입 시 contentSchema.parse를 강제해 미검증 콘텐츠가 좌표 계산에 도달할 수 없다.
 */
export interface LayoutRuntime {
  key: string
  name: string
  description: string
  contentSchema: z.ZodType
  build: (content: unknown, ctx: LayoutContext) => LayoutResult
}

export function defineLayout<S extends z.ZodType>(def: LayoutDefinition<S>): LayoutRuntime {
  return {
    key: def.key,
    name: def.name,
    description: def.description,
    contentSchema: def.contentSchema,
    build: (content, ctx) => def.build(def.contentSchema.parse(content), ctx),
  }
}

/** 콘텐츠 텍스트가 프레임을 넘칠 때의 1차 방어 — 글자수 기반 클램프(정밀 계측은 P5) */
export function clampText(text: string, maxChars: number): string {
  return text.length <= maxChars ? text : `${text.slice(0, maxChars - 1)}…`
}

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
  /** LLM 선택 카탈로그에서 숨김(시스템 전용 레이아웃 — 예: 출처 슬라이드) */
  hidden?: boolean
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
  hidden: boolean
}

/** 레이아웃이 설계된 기준 캔버스(16:9). 다른 비율은 이 결과를 비례 리매핑 */
const REFERENCE_CANVAS = { width: 1280, height: 720 }

/** 요소 프레임/폰트를 기준 캔버스 → 타깃 캔버스로 비례 변환(화면비 스윕, P9) */
function remapToCanvas(result: LayoutResult, canvas: LayoutContext['canvas']): LayoutResult {
  const sx = canvas.width / REFERENCE_CANVAS.width
  const sy = canvas.height / REFERENCE_CANVAS.height
  if (sx === 1 && sy === 1) return result // 16:9는 무변경(하위호환)
  const fontScale = Math.min(sx, sy)
  return {
    ...result,
    elements: result.elements.map((el) => {
      const frame = { x: el.frame.x * sx, y: el.frame.y * sy, w: el.frame.w * sx, h: el.frame.h * sy }
      if ((el.type === 'text' || el.type === 'list') && el.style.fontSize !== undefined) {
        return { ...el, frame, style: { ...el.style, fontSize: Math.round(el.style.fontSize * fontScale) } }
      }
      return { ...el, frame }
    }),
  }
}

export function defineLayout<S extends z.ZodType>(def: LayoutDefinition<S>): LayoutRuntime {
  return {
    key: def.key,
    name: def.name,
    description: def.description,
    contentSchema: def.contentSchema,
    // 기준 캔버스로 빌드 후 타깃 비율로 리매핑 — 레이아웃 코드는 1280×720만 신경
    build: (content, ctx) =>
      remapToCanvas(def.build(def.contentSchema.parse(content), { canvas: REFERENCE_CANVAS }), ctx.canvas),
    hidden: def.hidden ?? false,
  }
}

/** 콘텐츠 텍스트가 프레임을 넘칠 때의 1차 방어 — 글자수 기반 클램프(정밀 계측은 P5) */
export function clampText(text: string, maxChars: number): string {
  return text.length <= maxChars ? text : `${text.slice(0, maxChars - 1)}…`
}

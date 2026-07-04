import { z } from 'zod'

/** 모든 엔티티 ID — 생성 방식(nanoid/uuid)에 비종속 */
export const idSchema = z.string().min(1)

/**
 * 색상 값 — hex 리터럴 또는 테마 토큰 참조(`token:colors.primary`).
 * 토큰 참조를 허용해 슬라이드가 테마 교체에 반응하도록 한다(하드코딩 방지).
 */
export const colorSchema = z
  .string()
  .regex(/^(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|token:[a-z][a-zA-Z0-9.]*)$/)

export const aspectRatioSchema = z.enum(['16:9', '4:3', '9:16'])
export type AspectRatio = z.infer<typeof aspectRatioSchema>

/** 가상 캔버스 좌표계 — 렌더러/익스포터가 공유하는 기준 해상도(px) */
export const CANVAS_SIZES: Record<AspectRatio, { width: number; height: number }> = {
  '16:9': { width: 1280, height: 720 },
  '4:3': { width: 1024, height: 768 },
  '9:16': { width: 720, height: 1280 },
}

/** 요소 배치 프레임 — 가상 캔버스 절대좌표 */
export const frameSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
})

export type Id = z.infer<typeof idSchema>
export type Color = z.infer<typeof colorSchema>
export type Frame = z.infer<typeof frameSchema>

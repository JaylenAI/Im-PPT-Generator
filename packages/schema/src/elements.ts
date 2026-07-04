import { z } from 'zod'
import { colorSchema, frameSchema, idSchema } from './primitives.js'

const baseElement = {
  id: idSchema,
  frame: frameSchema,
  rotation: z.number().min(-360).max(360).default(0),
  opacity: z.number().min(0).max(1).default(1),
  locked: z.boolean().default(false),
}

export const textStyleSchema = z.object({
  fontSize: z.number().positive().optional(),
  fontWeight: z.enum(['regular', 'medium', 'semibold', 'bold']).optional(),
  color: colorSchema.optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  lineHeight: z.number().positive().optional(),
})

export const textElementSchema = z.object({
  ...baseElement,
  type: z.literal('text'),
  /** role이 테마 타이포 스케일과 연결 — style은 개별 오버라이드 */
  role: z.enum(['display', 'title', 'subtitle', 'body', 'caption']),
  content: z.string(),
  style: textStyleSchema.default({}),
})

export const listElementSchema = z.object({
  ...baseElement,
  type: z.literal('list'),
  items: z.array(z.string().min(1)).min(1),
  marker: z.enum(['dot', 'dash', 'number', 'check']).default('dot'),
  style: textStyleSchema.default({}),
})

export const imageElementSchema = z.object({
  ...baseElement,
  type: z.literal('image'),
  src: z.string().min(1),
  fit: z.enum(['cover', 'contain', 'fill']).default('cover'),
  alt: z.string().default(''),
  /** 출처 추적 — 리서치 파이프라인이 채움 */
  citationId: idSchema.optional(),
  cornerRadius: z.number().min(0).optional(),
})

export const shapeElementSchema = z.object({
  ...baseElement,
  type: z.literal('shape'),
  shape: z.enum(['rect', 'ellipse', 'line', 'arrow']),
  fill: colorSchema.optional(),
  stroke: z.object({ color: colorSchema, width: z.number().positive() }).optional(),
  cornerRadius: z.number().min(0).optional(),
})

export const chartElementSchema = z.object({
  ...baseElement,
  type: z.literal('chart'),
  chartType: z.enum(['bar', 'horizontalBar', 'line', 'area', 'pie', 'donut', 'scatter', 'waterfall']),
  data: z.object({
    labels: z.array(z.string()).min(1),
    series: z
      .array(z.object({ name: z.string(), values: z.array(z.number()).min(1) }))
      .min(1),
  }),
  options: z
    .object({
      showLegend: z.boolean().default(true),
      showValues: z.boolean().default(false),
      palette: z.array(colorSchema).optional(),
      /** 데이터 스토리텔링(ADR-011) — 강조할 데이터 포인트 인덱스(labels 기준). 나머지는 흐리게 */
      highlightIndex: z.number().int().min(0).optional(),
      /** 워터폴 전용 — 마지막 값을 총계 막대(0부터)로 그림 */
      waterfallTotalLast: z.boolean().optional(),
    })
    .prefault({}),
  citationIds: z.array(idSchema).default([]),
})

export const tableElementSchema = z.object({
  ...baseElement,
  type: z.literal('table'),
  header: z.array(z.string()).optional(),
  rows: z.array(z.array(z.string()).min(1)).min(1),
  citationIds: z.array(idSchema).default([]),
})

export const iconElementSchema = z.object({
  ...baseElement,
  type: z.literal('icon'),
  /** 아이콘 세트(material symbols) 내 이름 — 렌더러/익스포터 공용 매핑 */
  name: z.string().min(1),
  color: colorSchema.optional(),
})

export const slideElementSchema = z.discriminatedUnion('type', [
  textElementSchema,
  listElementSchema,
  imageElementSchema,
  shapeElementSchema,
  chartElementSchema,
  tableElementSchema,
  iconElementSchema,
])

export type TextElement = z.infer<typeof textElementSchema>
export type ChartElement = z.infer<typeof chartElementSchema>
export type SlideElement = z.infer<typeof slideElementSchema>

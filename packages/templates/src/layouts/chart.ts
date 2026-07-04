import { z } from 'zod'
import type { SlideElement } from '@im-ppt/schema'
import type { LayoutDefinition } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, rect, text } from './helpers.js'

const contentSchema = z.object({
  title: z.string().min(1).max(70),
  chartType: z.enum(['bar', 'horizontalBar', 'line', 'area', 'pie', 'donut', 'scatter', 'waterfall']),
  data: z.object({
    labels: z.array(z.string().min(1).max(24)).min(1).max(12),
    series: z
      .array(z.object({ name: z.string().max(30), values: z.array(z.number()).min(1).max(12) }))
      .min(1)
      .max(4),
  }),
  insight: z.string().max(140).optional(),
  /** 데이터 스토리텔링(ADR-011) — 강조할 데이터 포인트 인덱스(labels 기준, 0부터). 그 값만 부각 */
  highlightIndex: z.number().int().min(0).optional(),
})

export const chartLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'chart',
  name: '차트',
  description:
    '데이터 시각화 장. 수치 팩트를 차트로. insight에 "그래서 무엇을 말하는가" 한 줄 해석을, highlightIndex에 가장 중요한 데이터 포인트 인덱스를 넣어 스토리텔링.',
  contentSchema,
  build: (c) => {
    const chartEl: SlideElement = {
      id: 'chart-main',
      type: 'chart',
      chartType: c.chartType,
      data: c.data,
      frame: c.insight
        ? { x: MARGIN, y: 190, w: 720, h: 440 }
        : { x: MARGIN, y: 190, w: CONTENT_W, h: 440 },
      options: {
        showLegend: c.data.series.length > 1,
        showValues: false,
        ...(c.highlightIndex !== undefined ? { highlightIndex: c.highlightIndex } : {}),
      },
      citationIds: [],
      rotation: 0,
      opacity: 1,
      locked: false,
    }
    return {
      background: { kind: 'color', color: 'token:colors.background' },
      elements: [
        text('chart-title', 'title', clampText(c.title, 70), { x: MARGIN, y: 70, w: CONTENT_W, h: 60 }, {
          color: 'token:colors.textPrimary',
          fontWeight: 'bold',
        }),
        rect('chart-underline', { x: MARGIN, y: 140, w: 64, h: 6 }, 'token:colors.primary', 3),
        chartEl,
        ...(c.insight
          ? [
              rect('chart-insight-card', { x: 840, y: 250, w: 360, h: 260 }, 'token:colors.surface', 12),
              text('chart-insight', 'body', clampText(c.insight, 140), { x: 864, y: 280, w: 312, h: 200 }, {
                color: 'token:colors.textPrimary',
                lineHeight: 1.6,
              }),
            ]
          : []),
      ],
    }
  },
}

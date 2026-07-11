import { z } from 'zod'
import type { SlideElement } from '@im-ppt/schema'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, rect, text } from './helpers.js'

const contentSchema = z.object({
  title: z.string().min(1).max(60),
  bars: z
    .array(
      z.object({
        label: z.string().min(1).max(36),
        value: z.number().min(0).max(100),
        caption: z.string().max(40).optional(),
      }),
    )
    .min(2)
    .max(6),
})

/** 지표 막대 — 라벨 + 가로 진행 막대(%). 역량·달성률·비중 시각화 */
export const metricBarsLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'metric-bars',
  name: '지표 막대',
  description:
    '라벨과 가로 진행 막대(0~100%)로 역량·숙련도·달성률·구성 비중을 시각화. value는 0~100 백분율. 항목 2~6개. 스킬 차트나 KPI 달성률에 사용.',
  contentSchema,
  build: (c): LayoutResult => {
    const els: SlideElement[] = [
      text('mb-title', 'title', clampText(c.title, 60), { x: MARGIN, y: 96, w: CONTENT_W, h: 56 }, {
        color: 'token:colors.textPrimary',
        fontWeight: 'bold',
      }),
      rect('mb-underline', { x: MARGIN, y: 162, w: 64, h: 6 }, 'token:colors.accent', 3),
    ]
    const n = c.bars.length
    const areaY = 232
    const rowH = 408 / n
    const trackH = Math.min(20, Math.round(rowH * 0.26))
    c.bars.forEach((b, i) => {
      const y = areaY + i * rowH
      const v = Math.max(0, Math.min(100, b.value))
      const fillW = Math.max(trackH, (CONTENT_W * v) / 100)
      els.push(
        text(`mb-label-${i}`, 'subtitle', clampText(b.label, 36), { x: MARGIN, y, w: CONTENT_W - 120, h: 30 }, {
          color: 'token:colors.textPrimary',
          fontWeight: 'semibold',
          fontSize: 19,
        }),
        text(`mb-val-${i}`, 'subtitle', `${Math.round(v)}%`, { x: MARGIN + CONTENT_W - 120, y, w: 120, h: 30 }, {
          color: 'token:colors.accent',
          align: 'right',
          fontWeight: 'bold',
          fontSize: 19,
        }),
        rect(`mb-track-${i}`, { x: MARGIN, y: y + 40, w: CONTENT_W, h: trackH }, 'token:colors.secondary', trackH / 2),
        rect(`mb-fill-${i}`, { x: MARGIN, y: y + 40, w: fillW, h: trackH }, 'token:colors.accent', trackH / 2),
      )
      if (b.caption) {
        els.push(
          text(`mb-cap-${i}`, 'caption', clampText(b.caption, 40), { x: MARGIN, y: y + 40 + trackH + 6, w: CONTENT_W, h: 22 }, {
            color: 'token:colors.textSecondary',
            fontSize: 13,
          }),
        )
      }
    })
    return { background: { kind: 'color', color: 'token:colors.background' }, elements: els }
  },
}

import { z } from 'zod'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, rect, text, splitColumns } from './helpers.js'
import type { SlideElement } from '@im-ppt/schema'

const contentSchema = z.object({
  title: z.string().min(1).max(70),
  kpis: z
    .array(z.object({ value: z.string().min(1).max(14), label: z.string().min(1).max(40), delta: z.string().max(16).optional() }))
    .min(2)
    .max(4),
})

/** KPI 대시보드 — 값+라벨+증감을 카드로. 성과/지표 요약(경영 리뷰·실적)에 사용. */
export const kpiLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'kpi-grid',
  name: 'KPI 대시보드',
  description: 'KPI 카드 그리드(값+라벨+증감 표시). 실적/성과 대시보드에 사용. stat보다 지표 밀도 높음.',
  contentSchema,
  build: (c): LayoutResult => {
    const cards = splitColumns({ x: MARGIN, y: 230, w: CONTENT_W, h: 300 }, c.kpis.length, 28)
    const elements: SlideElement[] = [
      text('kpi-title', 'title', clampText(c.title, 70), { x: MARGIN, y: 80, w: CONTENT_W, h: 56 }, { color: 'token:colors.textPrimary', fontWeight: 'bold' }),
      rect('kpi-underline', { x: MARGIN, y: 146, w: 64, h: 6 }, 'token:colors.primary', 3),
    ]
    c.kpis.forEach((k, i) => {
      const card = cards[i]
      if (!card) return
      elements.push(
        rect(`kpi-card-${i}`, card, 'token:colors.surface', 14),
        rect(`kpi-accent-${i}`, { x: card.x, y: card.y, w: card.w, h: 6 }, 'token:colors.accent', 3),
        text(`kpi-value-${i}`, 'display', clampText(k.value, 14), { x: card.x + 20, y: card.y + 56, w: card.w - 40, h: 76 }, { color: 'token:colors.primary', fontWeight: 'bold', align: 'center' }),
        text(`kpi-label-${i}`, 'body', clampText(k.label, 40), { x: card.x + 20, y: card.y + 150, w: card.w - 40, h: 52 }, { color: 'token:colors.textSecondary', align: 'center' }),
      )
      if (k.delta) {
        elements.push(text(`kpi-delta-${i}`, 'caption', clampText(k.delta, 16), { x: card.x + 20, y: card.y + 210, w: card.w - 40, h: 30 }, { color: 'token:colors.success', fontWeight: 'semibold', align: 'center' }))
      }
    })
    return { background: { kind: 'color', color: 'token:colors.background' }, elements }
  },
}

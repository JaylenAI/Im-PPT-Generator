import { z } from 'zod'
import type { SlideElement } from '@im-ppt/schema'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, rect, splitColumns, text } from './helpers.js'

const contentSchema = z.object({
  title: z.string().max(60).optional(),
  cards: z
    .array(
      z.object({
        value: z.string().min(1).max(12),
        label: z.string().min(1).max(28),
        delta: z.string().max(16).optional(),
        trend: z.enum(['up', 'down', 'flat']).optional(),
        note: z.string().max(40).optional(),
      }),
    )
    .min(2)
    .max(4),
})

const TREND_MARK = { up: '▲ ', down: '▼ ', flat: '– ' } as const

/** 대시보드 카드 — KPI 지표 카드 그리드(값·라벨·증감) */
export const dashboardCardsLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'dashboard-cards',
  name: '대시보드 카드',
  description:
    'KPI 지표 카드 그리드. 각 카드에 큰 수치 값·라벨·증감(delta, trend up/down/flat로 색상)·부가 설명. SaaS 지표·실적 요약·현황 대시보드에 사용. 2~4개.',
  contentSchema,
  build: (c): LayoutResult => {
    const els: SlideElement[] = []
    let top = 214
    if (c.title) {
      els.push(
        text('dc-title', 'title', clampText(c.title, 60), { x: MARGIN, y: 96, w: CONTENT_W, h: 56 }, {
          color: 'token:colors.textPrimary',
          fontWeight: 'bold',
        }),
        rect('dc-underline', { x: MARGIN, y: 162, w: 64, h: 6 }, 'token:colors.accent', 3),
      )
      top = 220
    } else {
      top = 170
    }
    const n = c.cards.length
    const cardH = 356
    const cols = splitColumns({ x: MARGIN, y: top, w: CONTENT_W, h: cardH }, n, 28)
    c.cards.forEach((card, i) => {
      const col = cols[i]
      if (!col) return
      const trendColor =
        card.trend === 'down' ? 'token:colors.error' : card.trend === 'flat' ? 'token:colors.textSecondary' : 'token:colors.success'
      els.push(
        rect(`dc-card-${i}`, col, 'token:colors.surface', 16),
        rect(`dc-tab-${i}`, { x: col.x + 24, y: col.y + 24, w: 44, h: 5 }, 'token:colors.accent', 2),
        text(`dc-value-${i}`, 'subtitle', clampText(card.value, 12), { x: col.x + 24, y: col.y + 52, w: col.w - 48, h: 78 }, {
          color: 'token:colors.textPrimary',
          fontWeight: 'bold',
          fontSize: 54,
        }),
        text(`dc-label-${i}`, 'subtitle', clampText(card.label, 28), { x: col.x + 24, y: col.y + 138, w: col.w - 48, h: 54 }, {
          color: 'token:colors.textSecondary',
          fontWeight: 'semibold',
          fontSize: 16,
          lineHeight: 1.3,
        }),
      )
      if (card.delta) {
        els.push(
          text(`dc-delta-${i}`, 'caption', TREND_MARK[card.trend ?? 'up'] + clampText(card.delta, 16), { x: col.x + 24, y: col.y + cardH - 58, w: col.w - 48, h: 26 }, {
            color: trendColor,
            fontWeight: 'bold',
            fontSize: 15,
          }),
        )
      }
      if (card.note) {
        els.push(
          text(`dc-note-${i}`, 'caption', clampText(card.note, 40), { x: col.x + 24, y: col.y + cardH - 32, w: col.w - 48, h: 24 }, {
            color: 'token:colors.textSecondary',
            fontSize: 12,
          }),
        )
      }
    })
    return { background: { kind: 'color', color: 'token:colors.background' }, elements: els }
  },
}

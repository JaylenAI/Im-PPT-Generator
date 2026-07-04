import { z } from 'zod'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, rect, text, splitColumns } from './helpers.js'
import type { SlideElement } from '@im-ppt/schema'

const contentSchema = z.object({
  title: z.string().min(1).max(70),
  cards: z
    .array(z.object({ heading: z.string().min(1).max(32), body: z.string().min(1).max(120) }))
    .min(2)
    .max(4),
})

/** 카드 — 기능/특징/혜택을 카드 그리드로. 3~4개 병렬 항목(제품 기능·서비스 특징)에 사용. */
export const cardsLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'cards',
  name: '특징 카드',
  description: '기능·특징·혜택을 병렬 카드로(제목+설명). 2~4개 항목을 나란히 소개할 때 사용.',
  contentSchema,
  build: (c): LayoutResult => {
    const cols = splitColumns({ x: MARGIN, y: 220, w: CONTENT_W, h: 340 }, c.cards.length, 28)
    const elements: SlideElement[] = [
      text('crd-title', 'title', clampText(c.title, 70), { x: MARGIN, y: 80, w: CONTENT_W, h: 56 }, { color: 'token:colors.textPrimary', fontWeight: 'bold' }),
      rect('crd-underline', { x: MARGIN, y: 146, w: 64, h: 6 }, 'token:colors.primary', 3),
    ]
    c.cards.forEach((card, i) => {
      const col = cols[i]
      if (!col) return
      elements.push(
        rect(`crd-card-${i}`, col, 'token:colors.surface', 16),
        rect(`crd-badge-${i}`, { x: col.x + 24, y: col.y + 28, w: 48, h: 48 }, 'token:colors.primary', 12),
        text(`crd-num-${i}`, 'subtitle', String(i + 1), { x: col.x + 24, y: col.y + 36, w: 48, h: 32 }, { color: 'token:colors.surface', align: 'center', fontWeight: 'bold' }),
        text(`crd-heading-${i}`, 'subtitle', clampText(card.heading, 32), { x: col.x + 24, y: col.y + 96, w: col.w - 48, h: 44 }, { color: 'token:colors.textPrimary', fontWeight: 'semibold' }),
        text(`crd-body-${i}`, 'body', clampText(card.body, 120), { x: col.x + 24, y: col.y + 148, w: col.w - 48, h: col.h - 168 }, { color: 'token:colors.textSecondary', lineHeight: 1.55 }),
      )
    })
    return { background: { kind: 'color', color: 'token:colors.background' }, elements }
  },
}

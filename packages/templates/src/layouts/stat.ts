import { z } from 'zod'
import type { LayoutDefinition } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, rect, splitColumns, text } from './helpers.js'

const contentSchema = z.object({
  title: z.string().min(1).max(70),
  stats: z
    .array(
      z.object({
        value: z.string().min(1).max(16),
        label: z.string().min(1).max(50),
      }),
    )
    .min(1)
    .max(4),
})

export const statLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'stat',
  name: '핵심 지표',
  description: '큰 숫자로 임팩트를 주는 장. 통계/성과 1~4개(값+라벨). 근거 팩트가 있는 수치에 사용.',
  contentSchema,
  build: (c) => {
    const cards = splitColumns({ x: MARGIN, y: 240, w: CONTENT_W, h: 280 }, c.stats.length, 32)
    return {
      background: { kind: 'color', color: 'token:colors.background' },
      elements: [
        text('stat-title', 'title', clampText(c.title, 70), { x: MARGIN, y: 70, w: CONTENT_W, h: 60 }, {
          color: 'token:colors.textPrimary',
          fontWeight: 'bold',
        }),
        rect('stat-underline', { x: MARGIN, y: 140, w: 64, h: 6 }, 'token:colors.primary', 3),
        ...c.stats.flatMap((s, i) => {
          const card = cards[i]
          if (!card) return []
          return [
            rect(`stat-card-${i}`, card, 'token:colors.surface', 12),
            text(`stat-value-${i}`, 'display', clampText(s.value, 16), { x: card.x + 24, y: card.y + 60, w: card.w - 48, h: 80 }, {
              color: 'token:colors.primary',
              fontWeight: 'bold',
              align: 'center',
            }),
            text(`stat-label-${i}`, 'body', clampText(s.label, 50), { x: card.x + 24, y: card.y + 160, w: card.w - 48, h: 60 }, {
              color: 'token:colors.textSecondary',
              align: 'center',
            }),
          ]
        }),
      ],
    }
  },
}

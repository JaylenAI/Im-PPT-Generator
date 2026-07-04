import { z } from 'zod'
import type { LayoutDefinition } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, bulletList, line, rect, text } from './helpers.js'

const columnSchema = z.object({
  heading: z.string().min(1).max(40),
  bullets: z.array(z.string().min(1).max(90)).min(1).max(5),
})

const contentSchema = z.object({
  title: z.string().min(1).max(70),
  left: columnSchema,
  right: columnSchema,
})

const COL_W = (CONTENT_W - 80) / 2

export const twoColLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'two-col',
  name: '2컬럼 비교',
  description: '두 개념 비교/대조(As-Is vs To-Be, 장점 vs 단점) 또는 병렬 카테고리 2개.',
  contentSchema,
  build: (c) => {
    const col = (side: 'left' | 'right', x: number) => [
      text(`twocol-${side}-heading`, 'subtitle', clampText(c[side].heading, 40), { x, y: 200, w: COL_W, h: 44 }, {
        color: 'token:colors.primary',
        fontWeight: 'semibold',
      }),
      bulletList(
        `twocol-${side}-bullets`,
        c[side].bullets.map((b) => clampText(b, 90)),
        { x, y: 260, w: COL_W, h: 360 },
        'dot',
        { color: 'token:colors.textPrimary', lineHeight: 1.6 },
      ),
    ]
    return {
      background: { kind: 'color', color: 'token:colors.background' },
      elements: [
        text('twocol-title', 'title', clampText(c.title, 70), { x: MARGIN, y: 70, w: CONTENT_W, h: 60 }, {
          color: 'token:colors.textPrimary',
          fontWeight: 'bold',
        }),
        rect('twocol-underline', { x: MARGIN, y: 140, w: 64, h: 6 }, 'token:colors.primary', 3),
        ...col('left', MARGIN),
        line('twocol-divider', { x: 636, y: 210, w: 2, h: 400 }, 'token:colors.secondary', 1),
        ...col('right', MARGIN + COL_W + 80),
      ],
    }
  },
}

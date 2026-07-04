import { z } from 'zod'
import type { LayoutDefinition } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, rect, text } from './helpers.js'

const contentSchema = z.object({
  title: z.string().min(1).max(80),
  subtitle: z.string().max(140).optional(),
  presenter: z.string().max(60).optional(),
  date: z.string().max(30).optional(),
})

export const titleLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'title',
  name: '타이틀',
  description: '덱의 첫 장. 발표 제목, 부제, 발표자/날짜. 표지가 필요할 때 사용.',
  contentSchema,
  build: (c) => ({
    background: { kind: 'color', color: 'token:colors.background' },
    elements: [
      rect('title-bar', { x: MARGIN, y: 300, w: 96, h: 8 }, 'token:colors.accent', 4),
      text('title-main', 'display', clampText(c.title, 80), { x: MARGIN, y: 330, w: CONTENT_W, h: 130 }, {
        color: 'token:colors.textPrimary',
        fontWeight: 'bold',
      }),
      ...(c.subtitle
        ? [
            text('title-sub', 'subtitle', clampText(c.subtitle, 140), { x: MARGIN, y: 470, w: CONTENT_W, h: 60 }, {
              color: 'token:colors.textSecondary',
            }),
          ]
        : []),
      ...(c.presenter || c.date
        ? [
            text(
              'title-meta',
              'caption',
              [c.presenter, c.date].filter(Boolean).join(' · '),
              { x: MARGIN, y: 600, w: CONTENT_W, h: 30 },
              { color: 'token:colors.secondary' },
            ),
          ]
        : []),
    ],
  }),
}

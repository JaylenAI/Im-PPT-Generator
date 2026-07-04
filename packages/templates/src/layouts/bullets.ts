import { z } from 'zod'
import type { LayoutDefinition } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, bulletList, rect, text } from './helpers.js'

const contentSchema = z.object({
  title: z.string().min(1).max(70),
  bullets: z.array(z.string().min(1).max(110)).min(2).max(6),
  note: z.string().max(120).optional(),
})

export const bulletsLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'bullets',
  name: '불릿 포인트',
  description: '가장 범용적인 본문 장. 제목 + 핵심 포인트 2~6개. 서술형 내용에 사용.',
  contentSchema,
  build: (c) => ({
    background: { kind: 'color', color: 'token:colors.background' },
    elements: [
      text('bullets-title', 'title', clampText(c.title, 70), { x: MARGIN, y: 70, w: CONTENT_W, h: 60 }, {
        color: 'token:colors.textPrimary',
        fontWeight: 'bold',
      }),
      rect('bullets-underline', { x: MARGIN, y: 140, w: 64, h: 6 }, 'token:colors.primary', 3),
      bulletList(
        'bullets-body',
        c.bullets.map((b) => clampText(b, 110)),
        { x: MARGIN, y: 190, w: CONTENT_W, h: 400 },
        'dot',
        { color: 'token:colors.textPrimary', lineHeight: 1.7 },
      ),
      ...(c.note
        ? [
            text('bullets-note', 'caption', clampText(c.note, 120), { x: MARGIN, y: 620, w: CONTENT_W, h: 30 }, {
              color: 'token:colors.secondary',
            }),
          ]
        : []),
    ],
  }),
}

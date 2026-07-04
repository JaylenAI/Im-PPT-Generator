import { z } from 'zod'
import type { LayoutDefinition } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, bulletList, rect, text } from './helpers.js'

const contentSchema = z.object({
  title: z.string().min(1).max(60).default('목차'),
  items: z.array(z.string().min(1).max(70)).min(2).max(8),
})

export const agendaLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'agenda',
  name: '목차',
  description: '발표 구성 안내. 2~8개 섹션 제목 나열. 보통 2번째 장.',
  contentSchema,
  build: (c) => ({
    background: { kind: 'color', color: 'token:colors.background' },
    elements: [
      text('agenda-title', 'title', clampText(c.title, 60), { x: MARGIN, y: 70, w: CONTENT_W, h: 60 }, {
        color: 'token:colors.textPrimary',
        fontWeight: 'bold',
      }),
      rect('agenda-underline', { x: MARGIN, y: 140, w: 64, h: 6 }, 'token:colors.primary', 3),
      bulletList(
        'agenda-items',
        c.items.map((i) => clampText(i, 70)),
        { x: MARGIN, y: 190, w: CONTENT_W - 200, h: 460 },
        'number',
        { color: 'token:colors.textPrimary', lineHeight: 1.8 },
      ),
    ],
  }),
}

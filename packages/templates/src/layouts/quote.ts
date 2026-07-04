import { z } from 'zod'
import type { LayoutDefinition } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, rect, text } from './helpers.js'

const contentSchema = z.object({
  quote: z.string().min(1).max(200),
  attribution: z.string().max(60).optional(),
})

export const quoteLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'quote',
  name: '인용',
  description: '핵심 메시지나 인용문 강조. 출처 있는 인용(quote 팩트)에 사용.',
  contentSchema,
  build: (c) => ({
    background: { kind: 'color', color: 'token:colors.background' },
    elements: [
      rect('quote-bar', { x: MARGIN, y: 220, w: 8, h: 220 }, 'token:colors.accent', 4),
      text('quote-text', 'subtitle', `“${clampText(c.quote, 200)}”`, { x: MARGIN + 48, y: 230, w: CONTENT_W - 96, h: 220 }, {
        color: 'token:colors.textPrimary',
        fontSize: 28,
        lineHeight: 1.5,
      }),
      ...(c.attribution
        ? [
            text('quote-attribution', 'caption', `— ${clampText(c.attribution, 60)}`, { x: MARGIN + 48, y: 480, w: CONTENT_W - 96, h: 30 }, {
              color: 'token:colors.secondary',
            }),
          ]
        : []),
    ],
  }),
}

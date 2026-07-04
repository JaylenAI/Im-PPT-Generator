import { z } from 'zod'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, rect, text } from './helpers.js'

const contentSchema = z.object({
  value: z.string().min(1).max(16),
  caption: z.string().min(1).max(70),
  context: z.string().max(120).optional(),
})

/** 빅 넘버 — 하나의 압도적 수치로 임팩트. 가장 중요한 단일 지표를 강조할 때 사용. */
export const bignumLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'bignum',
  name: '빅 넘버',
  description: '하나의 큰 수치로 임팩트를 주는 장. 가장 중요한 단일 지표/성과를 강조할 때 사용.',
  contentSchema,
  build: (c) => ({
    background: { kind: 'color', color: 'token:colors.background' },
    elements: [
      rect('big-accent', { x: MARGIN, y: 190, w: 90, h: 10 }, 'token:colors.accent', 4),
      text('big-value', 'display', clampText(c.value, 16), { x: MARGIN, y: 220, w: CONTENT_W, h: 190 }, { color: 'token:colors.primary', fontWeight: 'bold' }),
      text('big-caption', 'title', clampText(c.caption, 70), { x: MARGIN, y: 430, w: CONTENT_W, h: 56 }, { color: 'token:colors.textPrimary', fontWeight: 'semibold' }),
      ...(c.context
        ? [text('big-context', 'body', clampText(c.context, 120), { x: MARGIN, y: 500, w: CONTENT_W - 200, h: 90 }, { color: 'token:colors.textSecondary', lineHeight: 1.6 })]
        : []),
    ],
  }),
}

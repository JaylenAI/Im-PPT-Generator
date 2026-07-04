import { z } from 'zod'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, rect, text, bulletList } from './helpers.js'
import type { SlideElement } from '@im-ppt/schema'

const side = z.object({ heading: z.string().min(1).max(30), items: z.array(z.string().min(1).max(80)).min(1).max(5) })
const contentSchema = z.object({
  title: z.string().min(1).max(70),
  left: side,
  right: side,
})

/** 비교 — A vs B 두 패널. 현재/개선, 기존/신규, 장단점 대조에 사용. */
export const comparisonLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'comparison',
  name: '비교',
  description: '두 항목을 좌우 패널로 대조(현재 vs 개선, 기존 vs 신규, A안 vs B안). 헤더+요점 리스트.',
  contentSchema,
  build: (c): LayoutResult => {
    const top = 210
    const h = 400
    const gap = 40
    const w = (CONTENT_W - gap) / 2
    const lx = MARGIN
    const rx = MARGIN + w + gap
    const panel = (idp: string, x: number, headerColor: string, heading: string, items: string[]): SlideElement[] => [
      rect(`${idp}-panel`, { x, y: top, w, h }, 'token:colors.surface', 16),
      rect(`${idp}-head`, { x, y: top, w, h: 64 }, headerColor, 16),
      text(`${idp}-heading`, 'subtitle', clampText(heading, 30), { x: x + 24, y: top + 16, w: w - 48, h: 36 }, { color: 'token:colors.surface', fontWeight: 'bold' }),
      bulletList(`${idp}-items`, items.map((s) => clampText(s, 80)), { x: x + 24, y: top + 88, w: w - 48, h: h - 108 }, 'dot', { color: 'token:colors.textPrimary', lineHeight: 1.6 }),
    ]
    return {
      background: { kind: 'color', color: 'token:colors.background' },
      elements: [
        text('cmp-title', 'title', clampText(c.title, 70), { x: MARGIN, y: 80, w: CONTENT_W, h: 56 }, { color: 'token:colors.textPrimary', fontWeight: 'bold' }),
        rect('cmp-underline', { x: MARGIN, y: 146, w: 64, h: 6 }, 'token:colors.primary', 3),
        ...panel('cmp-l', lx, 'token:colors.secondary', c.left.heading, c.left.items),
        ...panel('cmp-r', rx, 'token:colors.primary', c.right.heading, c.right.items),
      ],
    }
  },
}

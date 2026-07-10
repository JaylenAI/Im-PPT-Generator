import { z } from 'zod'
import type { SlideElement } from '@im-ppt/schema'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { rect, text } from './helpers.js'

const contentSchema = z.object({
  quote: z.string().min(1).max(220),
  attribution: z.string().max(60).optional(),
  role: z.string().max(60).optional(),
})

/**
 * 디자인 인용 — 대형 인용부호 + 구조화된 출처 블록을 가진 풀 인용 슬라이드.
 * 기본 quote보다 시각적으로 강조되며 발표자/기관 출처를 강조할 때.
 */
export const featureQuoteLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'feature-quote',
  name: '디자인 인용',
  description:
    '고객 후기·전문가 발언·명언을 대형 인용부호와 함께 강조하는 인용 슬라이드. 발언자와 소속을 하단에 구조화해 표기. 신뢰·권위를 강조하는 장면에 사용.',
  contentSchema,
  build: (c): LayoutResult => {
    const els: SlideElement[] = [
      text('fq-mark', 'display', '“', { x: 72, y: 88, w: 240, h: 200 }, {
        color: 'token:colors.accent',
        fontWeight: 'bold',
        fontSize: 170,
      }),
      text('fq-quote', 'display', clampText(c.quote, 220), { x: 80, y: 300, w: 1120, h: 240 }, {
        color: 'token:colors.textPrimary',
        fontWeight: 'medium',
        fontSize: 36,
        lineHeight: 1.35,
      }),
      rect('fq-rule', { x: 80, y: 560, w: 44, h: 4 }, 'token:colors.accent', 2),
    ]
    if (c.attribution) {
      els.push(
        text('fq-attr', 'subtitle', clampText(c.attribution, 60), { x: 80, y: 578, w: 900, h: 36 }, {
          color: 'token:colors.textPrimary',
          fontWeight: 'bold',
        }),
      )
    }
    if (c.role) {
      els.push(
        text('fq-role', 'caption', clampText(c.role, 60), { x: 80, y: 622, w: 900, h: 28 }, {
          color: 'token:colors.textSecondary',
        }),
      )
    }
    return { background: { kind: 'color', color: 'token:colors.background' }, elements: els }
  },
}

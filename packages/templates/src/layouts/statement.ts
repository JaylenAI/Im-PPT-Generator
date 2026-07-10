import { z } from 'zod'
import type { SlideElement } from '@im-ppt/schema'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { rect, text } from './helpers.js'

const contentSchema = z.object({
  kicker: z.string().max(28).optional(),
  statement: z.string().min(1).max(160),
  source: z.string().max(70).optional(),
})

/**
 * 명제 — 하나의 핵심 문장을 화면 가득 키운 키노트형 슬라이드.
 * 숫자 강조(bignum)와 달리 "한 문장의 주장"을 담는다. 전환/결론/핵심 메시지에.
 */
export const statementLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'statement',
  name: '핵심 명제',
  description:
    '하나의 핵심 주장·메시지를 큰 문장으로 강조하는 키노트형 슬라이드. 슬로건, 결론 한 줄, 관점 선언에 적합. 짧고 강한 한 문장일 때 사용(긴 목록은 bullets).',
  contentSchema,
  build: (c): LayoutResult => {
    const els: SlideElement[] = []
    if (c.kicker) {
      els.push(
        text('st-kicker', 'caption', clampText(c.kicker, 28), { x: 80, y: 168, w: 1120, h: 30 }, {
          color: 'token:colors.accent',
          fontWeight: 'semibold',
        }),
      )
    }
    els.push(
      rect('st-rule', { x: 80, y: 210, w: 56, h: 5 }, 'token:colors.accent', 2),
      text('st-body', 'display', clampText(c.statement, 160), { x: 80, y: 248, w: 1120, h: 340 }, {
        color: 'token:colors.textPrimary',
        fontWeight: 'bold',
        fontSize: 52,
        lineHeight: 1.25,
      }),
    )
    if (c.source) {
      els.push(
        text('st-source', 'caption', clampText(c.source, 70), { x: 80, y: 606, w: 1120, h: 30 }, {
          color: 'token:colors.textSecondary',
        }),
      )
    }
    return { background: { kind: 'color', color: 'token:colors.background' }, elements: els }
  },
}

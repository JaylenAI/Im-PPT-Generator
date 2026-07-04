import { z } from 'zod'
import type { LayoutDefinition } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, rect, text } from './helpers.js'

const contentSchema = z.object({
  headline: z
    .string()
    .min(1)
    .max(60)
    .describe('슬라이드에 크게 표시될 마무리 헤드라인 문구 자체(예: "지금 시작하세요"). 작업 설명이 아니라 청중이 읽을 실제 문구.'),
  message: z
    .string()
    .max(140)
    .optional()
    .describe('헤드라인 아래 보조 메시지 한 줄(선택). 실제 표시 문구만. 없으면 생략.'),
})

export const closingLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'closing',
  name: '마무리',
  description: '덱의 마지막 장. 감사 인사 또는 핵심 요약/CTA 한 줄.',
  contentSchema,
  build: (c) => ({
    background: { kind: 'color', color: 'token:colors.background' },
    elements: [
      text('closing-headline', 'display', clampText(c.headline, 60), { x: MARGIN, y: 280, w: CONTENT_W, h: 110 }, {
        color: 'token:colors.textPrimary',
        fontWeight: 'bold',
        align: 'center',
      }),
      rect('closing-bar', { x: 592, y: 410, w: 96, h: 8 }, 'token:colors.accent', 4),
      ...(c.message
        ? [
            text('closing-message', 'subtitle', clampText(c.message, 140), { x: MARGIN, y: 450, w: CONTENT_W, h: 60 }, {
              color: 'token:colors.textSecondary',
              align: 'center',
            }),
          ]
        : []),
    ],
  }),
}

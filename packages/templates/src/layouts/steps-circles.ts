import { z } from 'zod'
import type { SlideElement } from '@im-ppt/schema'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, ellipse, rect, text } from './helpers.js'

const contentSchema = z.object({
  title: z.string().max(60).optional(),
  steps: z
    .array(z.object({ title: z.string().min(1).max(28), body: z.string().max(90).optional() }))
    .min(2)
    .max(5),
})

/** 원형 단계 — 번호 원 + 연결선의 프로세스(가로 배열) */
export const stepsCirclesLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'steps-circles',
  name: '원형 단계',
  description:
    '번호가 매겨진 큰 원을 가로로 연결한 단계 흐름. 각 원 아래 단계 제목·설명. 절차·프로세스·로드맵을 2~5단계로 보여줄 때 사용.',
  contentSchema,
  build: (c): LayoutResult => {
    const els: SlideElement[] = []
    let top = 250
    if (c.title) {
      els.push(
        text('sc-title', 'title', clampText(c.title, 60), { x: MARGIN, y: 96, w: CONTENT_W, h: 56 }, {
          color: 'token:colors.textPrimary',
          fontWeight: 'bold',
          align: 'center',
        }),
      )
      top = 258
    } else {
      top = 214
    }
    const n = c.steps.length
    const cellW = CONTENT_W / n
    const d = 104
    // 원 중심을 잇는 연결선(원보다 먼저 그려 원이 덮도록)
    els.push(rect('sc-connector', { x: MARGIN + cellW / 2, y: top + d / 2 - 2, w: CONTENT_W - cellW, h: 4 }, 'token:colors.secondary'))
    c.steps.forEach((s, i) => {
      const cx = MARGIN + cellW * i + cellW / 2
      els.push(
        ellipse(`sc-circle-${i}`, { x: cx - d / 2, y: top, w: d, h: d }, 'token:colors.accent'),
        text(`sc-num-${i}`, 'subtitle', String(i + 1), { x: cx - d / 2, y: top + 18, w: d, h: d - 36 }, {
          color: 'token:colors.surface',
          align: 'center',
          fontWeight: 'bold',
          fontSize: 46,
        }),
        text(`sc-stitle-${i}`, 'subtitle', clampText(s.title, 28), { x: cx - cellW / 2 + 12, y: top + d + 26, w: cellW - 24, h: 54 }, {
          color: 'token:colors.textPrimary',
          align: 'center',
          fontWeight: 'semibold',
          fontSize: 18,
        }),
      )
      if (s.body) {
        els.push(
          text(`sc-body-${i}`, 'body', clampText(s.body, 90), { x: cx - cellW / 2 + 16, y: top + d + 86, w: cellW - 32, h: 130 }, {
            color: 'token:colors.textSecondary',
            align: 'center',
            lineHeight: 1.45,
            fontSize: 14,
          }),
        )
      }
    })
    return { background: { kind: 'color', color: 'token:colors.background' }, elements: els }
  },
}

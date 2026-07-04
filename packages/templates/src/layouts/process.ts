import { z } from 'zod'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, splitColumns, rect, text } from './helpers.js'
import type { SlideElement } from '@im-ppt/schema'

const contentSchema = z.object({
  title: z.string().min(1).max(70),
  steps: z.array(z.object({ label: z.string().min(1).max(28), detail: z.string().max(70).optional() })).min(2).max(5),
})

/** 프로세스/단계 다이어그램 — 순차 단계를 카드+화살표로. 흐름/절차/로드맵에 사용. */
export const processLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'process',
  name: '프로세스',
  description: '순차적 단계·절차·흐름을 화살표로 연결한 다이어그램. 프로세스/로드맵/방법론에 사용.',
  contentSchema,
  build: (c): LayoutResult => {
    const cols = splitColumns({ x: MARGIN, y: 250, w: CONTENT_W, h: 200 }, c.steps.length, 40)
    const elements: SlideElement[] = [
      text('proc-title', 'title', clampText(c.title, 70), { x: MARGIN, y: 80, w: CONTENT_W, h: 56 }, {
        color: 'token:colors.textPrimary', fontWeight: 'bold',
      }),
      rect('proc-underline', { x: MARGIN, y: 146, w: 64, h: 6 }, 'token:colors.primary', 3),
    ]
    c.steps.forEach((step, i) => {
      const col = cols[i]!
      elements.push(
        rect(`proc-card-${i}`, col, 'token:colors.surface', 12),
        rect(`proc-badge-${i}`, { x: col.x + 16, y: col.y + 16, w: 36, h: 36 }, 'token:colors.primary', 18),
        text(`proc-num-${i}`, 'subtitle', String(i + 1), { x: col.x + 16, y: col.y + 20, w: 36, h: 28 }, {
          color: 'token:colors.surface', align: 'center', fontWeight: 'bold',
        }),
        text(`proc-label-${i}`, 'subtitle', clampText(step.label, 28), { x: col.x + 16, y: col.y + 64, w: col.w - 32, h: 40 }, {
          color: 'token:colors.textPrimary', fontWeight: 'semibold',
        }),
      )
      if (step.detail) {
        elements.push(
          text(`proc-detail-${i}`, 'caption', clampText(step.detail, 70), { x: col.x + 16, y: col.y + 108, w: col.w - 32, h: 70 }, {
            color: 'token:colors.textSecondary',
          }),
        )
      }
      // 카드 사이 화살표
      if (i < c.steps.length - 1) {
        const next = cols[i + 1]!
        elements.push({
          id: `proc-arrow-${i}`, type: 'shape', shape: 'arrow',
          frame: { x: col.x + col.w + 6, y: col.y + col.h / 2 - 6, w: 28, h: 12 },
          fill: 'token:colors.primary', rotation: 0, opacity: 1, locked: false,
        })
      }
    })
    return { background: { kind: 'color', color: 'token:colors.background' }, elements }
  },
}

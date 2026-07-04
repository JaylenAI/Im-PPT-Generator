import { z } from 'zod'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, rect, text } from './helpers.js'
import type { SlideElement } from '@im-ppt/schema'

const contentSchema = z.object({
  title: z.string().min(1).max(70),
  milestones: z
    .array(z.object({ date: z.string().min(1).max(20), label: z.string().min(1).max(36), detail: z.string().max(60).optional() }))
    .min(2)
    .max(5),
})

/** 타임라인 — 시간순 마일스톤을 가로선 위 점으로. 연혁/일정/로드맵(시간축)에 사용. */
export const timelineLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'timeline',
  name: '타임라인',
  description: '시간순 마일스톤(연도·시점)을 가로선 위 점으로 표시. 연혁·일정·성장 스토리에 사용.',
  contentSchema,
  build: (c): LayoutResult => {
    const n = c.milestones.length
    const lineY = 380
    const startX = MARGIN + 40
    const spanW = CONTENT_W - 80
    const step = n > 1 ? spanW / (n - 1) : 0
    const elements: SlideElement[] = [
      text('tl-title', 'title', clampText(c.title, 70), { x: MARGIN, y: 80, w: CONTENT_W, h: 56 }, { color: 'token:colors.textPrimary', fontWeight: 'bold' }),
      rect('tl-underline', { x: MARGIN, y: 146, w: 64, h: 6 }, 'token:colors.primary', 3),
      rect('tl-line', { x: startX, y: lineY - 2, w: spanW, h: 4 }, 'token:colors.secondary', 2),
    ]
    c.milestones.forEach((m, i) => {
      const cx = startX + step * i
      const up = i % 2 === 0
      elements.push(
        rect(`tl-dot-${i}`, { x: cx - 10, y: lineY - 10, w: 20, h: 20 }, 'token:colors.primary', 10),
        text(`tl-date-${i}`, 'subtitle', clampText(m.date, 20), { x: cx - 90, y: up ? lineY - 140 : lineY + 24, w: 180, h: 30 }, { color: 'token:colors.primary', fontWeight: 'bold', align: 'center' }),
        text(`tl-label-${i}`, 'body', clampText(m.label, 36), { x: cx - 90, y: up ? lineY - 106 : lineY + 58, w: 180, h: 34 }, { color: 'token:colors.textPrimary', fontWeight: 'semibold', align: 'center' }),
      )
      if (m.detail) {
        elements.push(text(`tl-detail-${i}`, 'caption', clampText(m.detail, 60), { x: cx - 90, y: up ? lineY - 72 : lineY + 92, w: 180, h: 48 }, { color: 'token:colors.textSecondary', align: 'center' }))
      }
    })
    return { background: { kind: 'color', color: 'token:colors.background' }, elements }
  },
}

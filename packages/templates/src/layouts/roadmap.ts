import { z } from 'zod'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, rect, text, bulletList, splitColumns } from './helpers.js'
import type { SlideElement } from '@im-ppt/schema'

const contentSchema = z.object({
  title: z.string().min(1).max(70),
  phases: z
    .array(z.object({ name: z.string().min(1).max(28), items: z.array(z.string().min(1).max(60)).min(1).max(4) }))
    .min(2)
    .max(4),
})

/** 로드맵 — 단계(Phase)별 항목을 컬럼으로. 실행 계획·단계별 로드맵에 사용. */
export const roadmapLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'roadmap',
  name: '로드맵',
  description: '단계(Phase)별 계획을 컬럼으로. 각 단계에 이름+할 일 리스트. 실행 로드맵·마일스톤 계획에 사용.',
  contentSchema,
  build: (c): LayoutResult => {
    const cols = splitColumns({ x: MARGIN, y: 220, w: CONTENT_W, h: 360 }, c.phases.length, 28)
    const elements: SlideElement[] = [
      text('rm-title', 'title', clampText(c.title, 70), { x: MARGIN, y: 80, w: CONTENT_W, h: 56 }, { color: 'token:colors.textPrimary', fontWeight: 'bold' }),
      rect('rm-underline', { x: MARGIN, y: 146, w: 64, h: 6 }, 'token:colors.primary', 3),
    ]
    c.phases.forEach((p, i) => {
      const col = cols[i]
      if (!col) return
      elements.push(
        rect(`rm-col-${i}`, col, 'token:colors.surface', 14),
        rect(`rm-head-${i}`, { x: col.x, y: col.y, w: col.w, h: 56 }, 'token:colors.primary', 14),
        text(`rm-phase-${i}`, 'caption', `PHASE ${i + 1}`, { x: col.x + 20, y: col.y + 10, w: col.w - 40, h: 16 }, { color: 'token:colors.surface', fontWeight: 'semibold' }),
        text(`rm-name-${i}`, 'subtitle', clampText(p.name, 28), { x: col.x + 20, y: col.y + 26, w: col.w - 40, h: 26 }, { color: 'token:colors.surface', fontWeight: 'bold' }),
        bulletList(`rm-items-${i}`, p.items.map((s) => clampText(s, 60)), { x: col.x + 20, y: col.y + 76, w: col.w - 40, h: col.h - 92 }, 'check', { color: 'token:colors.textPrimary', lineHeight: 1.6 }),
      )
    })
    return { background: { kind: 'color', color: 'token:colors.background' }, elements }
  },
}

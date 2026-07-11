import { z } from 'zod'
import type { SlideElement } from '@im-ppt/schema'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, ellipse, rect, splitColumns, text } from './helpers.js'

const contentSchema = z.object({
  title: z.string().max(60).optional(),
  members: z
    .array(
      z.object({
        name: z.string().min(1).max(24),
        role: z.string().min(1).max(28),
        note: z.string().max(50).optional(),
      }),
    )
    .min(2)
    .max(4),
})

/** 팀 그리드 — 모노그램 아바타 + 이름·역할 카드(2~4명) */
export const teamGridLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'team-grid',
  name: '팀 소개',
  description:
    '원형 모노그램 아바타 + 이름·역할·한줄 소개를 가로로 배열한 팀 소개. 구성원·조직·발표자 소개에 사용. 2~4명. 아바타는 이름 첫 글자(사진은 편집기에서 교체).',
  contentSchema,
  build: (c): LayoutResult => {
    const els: SlideElement[] = []
    let top = 214
    if (c.title) {
      els.push(
        text('tg-title', 'title', clampText(c.title, 60), { x: MARGIN, y: 96, w: CONTENT_W, h: 56 }, {
          color: 'token:colors.textPrimary',
          fontWeight: 'bold',
        }),
        rect('tg-underline', { x: MARGIN, y: 162, w: 64, h: 6 }, 'token:colors.accent', 3),
      )
      top = 220
    } else {
      top = 160
    }
    const n = c.members.length
    const cols = splitColumns({ x: MARGIN, y: top, w: CONTENT_W, h: 380 }, n, 28)
    const d = 132
    c.members.forEach((m, i) => {
      const col = cols[i]
      if (!col) return
      const cx = col.x + col.w / 2
      const initial = (m.name.trim().charAt(0) || '?').toUpperCase()
      els.push(
        ellipse(`tg-av-${i}`, { x: cx - d / 2, y: col.y, w: d, h: d }, 'token:colors.primary'),
        text(`tg-init-${i}`, 'subtitle', initial, { x: cx - d / 2, y: col.y + 32, w: d, h: d - 64 }, {
          color: 'token:colors.surface',
          align: 'center',
          fontWeight: 'bold',
          fontSize: 52,
        }),
        text(`tg-name-${i}`, 'subtitle', clampText(m.name, 24), { x: col.x, y: col.y + d + 22, w: col.w, h: 34 }, {
          color: 'token:colors.textPrimary',
          align: 'center',
          fontWeight: 'bold',
          fontSize: 20,
        }),
        text(`tg-role-${i}`, 'caption', clampText(m.role, 28), { x: col.x, y: col.y + d + 58, w: col.w, h: 26 }, {
          color: 'token:colors.accent',
          align: 'center',
          fontWeight: 'semibold',
          fontSize: 14,
        }),
      )
      if (m.note) {
        els.push(
          text(`tg-note-${i}`, 'body', clampText(m.note, 50), { x: col.x + 8, y: col.y + d + 92, w: col.w - 16, h: 82 }, {
            color: 'token:colors.textSecondary',
            align: 'center',
            lineHeight: 1.4,
            fontSize: 13,
          }),
        )
      }
    })
    return { background: { kind: 'color', color: 'token:colors.background' }, elements: els }
  },
}

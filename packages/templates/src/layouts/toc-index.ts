import { z } from 'zod'
import type { SlideElement } from '@im-ppt/schema'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, rect, text } from './helpers.js'

const contentSchema = z.object({
  title: z.string().min(1).max(40),
  items: z
    .array(z.object({ label: z.string().min(1).max(40), note: z.string().max(48).optional() }))
    .min(3)
    .max(6),
})

/** 목차/인덱스 — 번호 매긴 섹션 목록(1~2열) */
export const tocIndexLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'toc-index',
  name: '목차',
  description:
    '번호를 매긴 섹션 목록. 발표/문서의 목차·인덱스·아젠다 개요에 사용. 항목 3~6개(4개 이상이면 2열로 배치). 각 항목에 짧은 설명(note)을 덧붙일 수 있음.',
  contentSchema,
  build: (c): LayoutResult => {
    const els: SlideElement[] = [
      text('toc-title', 'title', clampText(c.title, 40), { x: MARGIN, y: 96, w: CONTENT_W, h: 56 }, {
        color: 'token:colors.textPrimary',
        fontWeight: 'bold',
      }),
      rect('toc-underline', { x: MARGIN, y: 162, w: 64, h: 6 }, 'token:colors.accent', 3),
    ]
    const n = c.items.length
    const cols = n > 3 ? 2 : 1
    const rows = Math.ceil(n / cols)
    const gap = 40
    const colW = (CONTENT_W - gap * (cols - 1)) / cols
    const areaY = 224
    const rowH = 416 / rows
    c.items.forEach((it, i) => {
      const col = Math.floor(i / rows) // 열 우선 채움(1열 끝까지 → 2열)
      const row = i % rows
      const x = MARGIN + col * (colW + gap)
      const y = areaY + row * rowH
      els.push(
        text(`toc-num-${i}`, 'subtitle', String(i + 1).padStart(2, '0'), { x, y, w: 76, h: 52 }, {
          color: 'token:colors.accent',
          fontWeight: 'bold',
          fontSize: 40,
        }),
        text(`toc-label-${i}`, 'subtitle', clampText(it.label, 40), { x: x + 92, y: y + 2, w: colW - 92, h: 32 }, {
          color: 'token:colors.textPrimary',
          fontWeight: 'semibold',
        }),
      )
      if (it.note) {
        els.push(
          text(`toc-note-${i}`, 'caption', clampText(it.note, 48), { x: x + 92, y: y + 38, w: colW - 92, h: 26 }, {
            color: 'token:colors.textSecondary',
            fontSize: 13,
          }),
        )
      }
      els.push(rect(`toc-div-${i}`, { x, y: y + rowH - 20, w: colW, h: 1 }, 'token:colors.secondary'))
    })
    return { background: { kind: 'color', color: 'token:colors.background' }, elements: els }
  },
}

import { z } from 'zod'
import type { SlideElement } from '@im-ppt/schema'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, rect, splitColumns, text } from './helpers.js'

const contentSchema = z.object({
  title: z.string().max(60).optional(),
  items: z
    .array(z.object({ caption: z.string().min(1).max(32), tag: z.string().max(20).optional() }))
    .min(2)
    .max(4),
})

/** 포토 스트립 — 이미지 슬롯 + 캡션의 가로 갤러리(포트폴리오/사례) */
export const photoStripLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'photo-strip',
  name: '포토 스트립',
  description:
    '가로로 나열된 이미지 슬롯 + 캡션의 갤러리. 포트폴리오 작업물·사례·제품 라인업을 2~4개 나란히 소개할 때. 이미지는 편집기에서 삽입(기본은 번호 자리 표시).',
  contentSchema,
  build: (c): LayoutResult => {
    const els: SlideElement[] = []
    let top = 210
    let areaH = 340
    if (c.title) {
      els.push(
        text('ps-title', 'title', clampText(c.title, 60), { x: MARGIN, y: 96, w: CONTENT_W, h: 56 }, {
          color: 'token:colors.textPrimary',
          fontWeight: 'bold',
        }),
        rect('ps-underline', { x: MARGIN, y: 162, w: 64, h: 6 }, 'token:colors.accent', 3),
      )
      top = 214
      areaH = 336
    } else {
      top = 150
      areaH = 420
    }
    const n = c.items.length
    const cols = splitColumns({ x: MARGIN, y: top, w: CONTENT_W, h: areaH }, n, 28)
    c.items.forEach((it, i) => {
      const col = cols[i]
      if (!col) return
      const slotH = col.h - 64
      els.push(
        rect(`ps-slot-${i}`, { x: col.x, y: col.y, w: col.w, h: slotH }, 'token:colors.surface', 14),
        text(`ps-idx-${i}`, 'subtitle', String(i + 1).padStart(2, '0'), { x: col.x, y: col.y + slotH / 2 - 46, w: col.w, h: 92 }, {
          color: 'token:colors.secondary',
          align: 'center',
          fontWeight: 'bold',
          fontSize: 64,
        }),
        rect(`ps-accent-${i}`, { x: col.x + col.w / 2 - 24, y: col.y + slotH - 5, w: 48, h: 5 }, 'token:colors.accent', 2),
        text(`ps-cap-${i}`, 'subtitle', clampText(it.caption, 32), { x: col.x, y: col.y + slotH + 16, w: col.w, h: 44 }, {
          color: 'token:colors.textPrimary',
          fontWeight: 'semibold',
          align: 'center',
          fontSize: 17,
        }),
      )
      if (it.tag) {
        const chipW = Math.min(col.w - 24, 24 + it.tag.length * 9)
        els.push(
          rect(`ps-tagbg-${i}`, { x: col.x + 12, y: col.y + 12, w: chipW, h: 28 }, 'token:colors.accent', 14),
          text(`ps-tag-${i}`, 'caption', clampText(it.tag, 20), { x: col.x + 12, y: col.y + 15, w: chipW, h: 22 }, {
            color: 'token:colors.surface',
            align: 'center',
            fontWeight: 'semibold',
            fontSize: 12,
          }),
        )
      }
    })
    return { background: { kind: 'color', color: 'token:colors.background' }, elements: els }
  },
}

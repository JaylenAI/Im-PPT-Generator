import { z } from 'zod'
import type { SlideElement } from '@im-ppt/schema'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, rect, text } from './helpers.js'

const contentSchema = z.object({
  kicker: z.string().max(32).optional(),
  title: z.string().min(1).max(48),
  subtitle: z.string().max(120).optional(),
  meta: z.array(z.string().min(1).max(28)).max(4).optional(),
})

/** 에디토리얼 표지 — 대형 타이포 중심의 이력서/포트폴리오/제안서 첫 장 */
export const editorialCoverLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'editorial-cover',
  name: '에디토리얼 표지',
  description:
    '대형 타이포 중심의 표지. 상단 키커(작은 라벨)·거대한 제목·부제·하단 메타 행(이름·날짜·역할 등). 이력서·포트폴리오·제안서의 첫 장에 사용.',
  contentSchema,
  build: (c): LayoutResult => {
    const textX = MARGIN + 40
    const textW = CONTENT_W - 40
    const els: SlideElement[] = [
      rect('ec-bar', { x: MARGIN, y: 100, w: 8, h: 128 }, 'token:colors.accent'),
    ]
    if (c.kicker) {
      els.push(
        text('ec-kicker', 'caption', clampText(c.kicker, 32), { x: textX, y: 104, w: textW, h: 26 }, {
          color: 'token:colors.accent',
          fontWeight: 'semibold',
          fontSize: 16,
        }),
      )
    }
    // 폭은 디자인 시스템 block 액센트 캡(760)에 맞춰 조임 → 어떤 시스템이든 블록이 제목을 덮음(넘침 방지)
    els.push(
      text('ec-title', 'display', clampText(c.title, 44), { x: textX, y: c.kicker ? 150 : 132, w: 760, h: 158 }, {
        color: 'token:colors.textPrimary',
        fontWeight: 'bold',
        fontSize: 64,
        lineHeight: 1.05,
      }),
    )
    if (c.subtitle) {
      els.push(
        text('ec-subtitle', 'subtitle', clampText(c.subtitle, 120), { x: textX, y: 344, w: Math.min(textW, 820), h: 96 }, {
          color: 'token:colors.textSecondary',
          lineHeight: 1.5,
        }),
      )
    }
    if (c.meta && c.meta.length > 0) {
      const items = c.meta.slice(0, 4)
      const cellW = CONTENT_W / items.length
      els.push(rect('ec-metaline', { x: MARGIN, y: 606, w: CONTENT_W, h: 2 }, 'token:colors.secondary'))
      items.forEach((m, i) => {
        els.push(
          text(`ec-meta-${i}`, 'caption', clampText(m, 28), { x: MARGIN + i * cellW, y: 626, w: cellW - 16, h: 40 }, {
            color: 'token:colors.textPrimary',
            fontWeight: 'medium',
            fontSize: 15,
          }),
        )
      })
    }
    return { background: { kind: 'color', color: 'token:colors.background' }, elements: els }
  },
}

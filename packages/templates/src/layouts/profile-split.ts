import { z } from 'zod'
import type { SlideElement } from '@im-ppt/schema'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { MARGIN, ellipse, rect, text } from './helpers.js'

const contentSchema = z.object({
  name: z.string().min(1).max(32),
  role: z.string().max(40).optional(),
  bio: z.string().max(280).optional(),
  details: z
    .array(z.object({ label: z.string().min(1).max(20), value: z.string().min(1).max(40) }))
    .min(2)
    .max(5),
})

/** 프로필 분할 — 좌측 모노그램 패널 + 우측 이름·소개·연락처 */
export const profileSplitLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'profile-split',
  name: '프로필 분할',
  description:
    '좌측 컬러 패널(이름 첫 글자 모노그램) + 우측에 이름·직함·자기소개·연락처(라벨:값). 이력서/포트폴리오의 About 슬라이드에 사용. details는 2~5개(이메일·전화·위치·링크 등).',
  contentSchema,
  build: (c): LayoutResult => {
    const initial = (c.name.trim().charAt(0) || 'A').toUpperCase()
    const panelW = 420
    const els: SlideElement[] = [
      rect('pf-panel', { x: 0, y: 0, w: panelW, h: 720 }, 'token:colors.primary'),
      ellipse('pf-mono', { x: panelW / 2 - 92, y: 250, w: 184, h: 184 }, 'token:colors.surface', 0.14),
      text('pf-initial', 'subtitle', initial, { x: panelW / 2 - 92, y: 274, w: 184, h: 148 }, {
        color: 'token:colors.surface',
        align: 'center',
        fontWeight: 'bold',
        fontSize: 96,
      }),
    ]
    const rx = panelW + 60
    const rw = 1280 - rx - MARGIN
    els.push(
      text('pf-name', 'display', clampText(c.name, 32), { x: rx, y: 118, w: rw, h: 74 }, {
        color: 'token:colors.textPrimary',
        fontWeight: 'bold',
        fontSize: 52,
      }),
    )
    if (c.role) {
      els.push(
        text('pf-role', 'subtitle', clampText(c.role, 40), { x: rx, y: 198, w: rw, h: 34 }, {
          color: 'token:colors.accent',
          fontWeight: 'semibold',
        }),
      )
    }
    if (c.bio) {
      els.push(
        text('pf-bio', 'body', clampText(c.bio, 280), { x: rx, y: c.role ? 252 : 210, w: rw, h: 170 }, {
          color: 'token:colors.textSecondary',
          lineHeight: 1.6,
        }),
      )
    }
    const dy = 442
    const rowH = 46
    c.details.forEach((d, i) => {
      const y = dy + i * rowH
      els.push(
        text(`pf-dl-${i}`, 'caption', clampText(d.label, 20).toUpperCase(), { x: rx, y, w: 150, h: 28 }, {
          color: 'token:colors.textSecondary',
          fontWeight: 'semibold',
          fontSize: 13,
        }),
        text(`pf-dv-${i}`, 'body', clampText(d.value, 40), { x: rx + 160, y: y - 2, w: rw - 160, h: 30 }, {
          color: 'token:colors.textPrimary',
        }),
      )
    })
    return { background: { kind: 'color', color: 'token:colors.background' }, elements: els }
  },
}

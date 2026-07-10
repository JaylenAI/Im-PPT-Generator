import { z } from 'zod'
import type { SlideElement } from '@im-ppt/schema'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { bulletList, rect, text } from './helpers.js'

const contentSchema = z.object({
  label: z.string().max(24).optional(),
  title: z.string().min(1).max(56),
  lead: z.string().max(150).optional(),
  points: z.array(z.string().min(1).max(90)).min(2).max(5),
})

/** 좌측 컬러 패널(제목·리드) + 우측 체크 리스트의 비대칭 에디토리얼 레이아웃 */
export const splitFeatureLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'split-feature',
  name: '분할 피처',
  description:
    '좌측 컬러 패널에 제목·요약, 우측에 핵심 포인트 체크 리스트를 배치하는 비대칭 구성. 제품 원칙·기능 요약·차별점을 강조할 때. 포인트는 2~5개.',
  contentSchema,
  build: (c): LayoutResult => {
    const panelW = 520
    const innerX = 56
    const innerW = panelW - innerX * 2
    const els: SlideElement[] = [
      rect('sf-panel', { x: 0, y: 0, w: panelW, h: 720 }, 'token:colors.primary'),
    ]
    if (c.label) {
      els.push(
        text('sf-label', 'caption', clampText(c.label, 24), { x: innerX, y: 150, w: innerW, h: 28 }, {
          color: 'token:colors.surface',
          fontWeight: 'semibold',
        }),
      )
    }
    els.push(
      text('sf-title', 'display', clampText(c.title, 56), { x: innerX, y: 196, w: innerW, h: 200 }, {
        color: 'token:colors.surface',
        fontWeight: 'bold',
        fontSize: 38,
        lineHeight: 1.15,
      }),
    )
    if (c.lead) {
      els.push(
        text('sf-lead', 'body', clampText(c.lead, 150), { x: innerX, y: 420, w: innerW, h: 170 }, {
          color: 'token:colors.surface',
          lineHeight: 1.5,
        }),
      )
    }
    els.push(
      bulletList(
        'sf-points',
        c.points.map((p) => clampText(p, 90)),
        { x: 600, y: 210, w: 600, h: 360 },
        'check',
        { color: 'token:colors.textPrimary', lineHeight: 1.9 },
      ),
    )
    return { background: { kind: 'color', color: 'token:colors.background' }, elements: els }
  },
}

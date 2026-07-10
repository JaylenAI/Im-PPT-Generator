import { z } from 'zod'
import type { SlideElement } from '@im-ppt/schema'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { rect, splitColumns, text, MARGIN, CONTENT_W } from './helpers.js'

const contentSchema = z.object({
  title: z.string().min(1).max(60),
  features: z
    .array(z.object({ heading: z.string().min(1).max(26), body: z.string().min(1).max(110) }))
    .min(3)
    .max(4),
})

/**
 * 피처 그리드 — 상단 제목 + 컬러 탭이 달린 3~4열 스펙 그리드.
 * cards(채운 카드)와 달리 상단 액센트 탭 + 헤어라인 구획의 에디토리얼 스펙시트 톤.
 */
export const featureGridLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'feature-grid',
  name: '피처 그리드',
  description:
    '3~4개 기능·특징을 상단 제목 아래 컬럼으로 나열하는 그리드. 각 컬럼은 액센트 탭 + 소제목 + 설명. 제품 기능 요약, 서비스 구성 요소 나열에 적합.',
  contentSchema,
  build: (c): LayoutResult => {
    const cols = splitColumns({ x: MARGIN, y: 236, w: CONTENT_W, h: 360 }, c.features.length, 36)
    const els: SlideElement[] = [
      text('fg-title', 'title', clampText(c.title, 60), { x: MARGIN, y: 80, w: CONTENT_W, h: 56 }, {
        color: 'token:colors.textPrimary',
        fontWeight: 'bold',
      }),
      rect('fg-underline', { x: MARGIN, y: 146, w: 64, h: 6 }, 'token:colors.primary', 3),
    ]
    c.features.forEach((f, i) => {
      const col = cols[i]!
      els.push(
        rect(`fg-tab-${i}`, { x: col.x, y: col.y, w: 48, h: 8 }, 'token:colors.accent', 2),
        text(`fg-h-${i}`, 'subtitle', clampText(f.heading, 26), { x: col.x, y: col.y + 26, w: col.w, h: 44 }, {
          color: 'token:colors.textPrimary',
          fontWeight: 'semibold',
        }),
        text(`fg-b-${i}`, 'body', clampText(f.body, 110), { x: col.x, y: col.y + 82, w: col.w, h: col.h - 92 }, {
          color: 'token:colors.textSecondary',
          lineHeight: 1.55,
        }),
      )
    })
    return { background: { kind: 'color', color: 'token:colors.background' }, elements: els }
  },
}

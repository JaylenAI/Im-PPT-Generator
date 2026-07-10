import { z } from 'zod'
import type { SlideElement } from '@im-ppt/schema'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { rect, text } from './helpers.js'

const contentSchema = z.object({
  index: z.string().max(6).optional(),
  label: z.string().max(28).optional(),
  title: z.string().min(1).max(60),
  subtitle: z.string().max(120).optional(),
})

/**
 * 섹션 구분 — 발표의 새 챕터/파트를 여는 대형 표지.
 * 좌측 스파인 + 선택적 대형 번호 + 큰 제목. 목차의 각 파트 시작 지점에 삽입.
 */
export const sectionLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'section',
  name: '섹션 구분',
  description:
    '발표의 새로운 챕터/파트를 여는 대형 구분 슬라이드. 큰 제목과 선택적 번호(01, 02…). 여러 주제·단계를 나눌 때 각 파트 앞에 배치해 흐름을 끊어준다.',
  contentSchema,
  build: (c): LayoutResult => {
    const els: SlideElement[] = [
      rect('sec-spine', { x: 0, y: 0, w: 16, h: 720 }, 'token:colors.accent'),
    ]
    if (c.index) {
      els.push(
        text('sec-index', 'display', clampText(c.index, 6), { x: 812, y: 120, w: 388, h: 180 }, {
          color: 'token:colors.secondary',
          align: 'right',
          fontWeight: 'bold',
          fontSize: 120,
        }),
      )
    }
    if (c.label) {
      els.push(
        text('sec-label', 'caption', clampText(c.label, 28), { x: 120, y: 250, w: 640, h: 30 }, {
          color: 'token:colors.accent',
          fontWeight: 'semibold',
        }),
      )
    }
    els.push(
      rect('sec-rule', { x: 120, y: 292, w: 56, h: 5 }, 'token:colors.accent', 2),
      text('sec-title', 'display', clampText(c.title, 60), { x: 120, y: 312, w: 1040, h: 160 }, {
        color: 'token:colors.textPrimary',
        fontWeight: 'bold',
        fontSize: 60,
        lineHeight: 1.1,
      }),
    )
    if (c.subtitle) {
      els.push(
        text('sec-sub', 'body', clampText(c.subtitle, 120), { x: 120, y: 486, w: 900, h: 80 }, {
          color: 'token:colors.textSecondary',
          lineHeight: 1.5,
        }),
      )
    }
    return { background: { kind: 'color', color: 'token:colors.background' }, elements: els }
  },
}

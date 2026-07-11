import { z } from 'zod'
import type { SlideElement } from '@im-ppt/schema'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { ellipse, image, rect, text } from './helpers.js'

const contentSchema = z.object({
  eyebrow: z.string().max(28).optional(),
  title: z.string().min(1).max(80),
  subtitle: z.string().max(140).optional(),
  /** 실 이미지(data URI/URL)가 있으면 우측 존을 사진으로 채움. 없으면 컬러 존으로 폴백 */
  imageSrc: z.string().min(1).optional(),
})

/**
 * 히어로 이미지 — 좌측 콘텐츠 + 우측 이미지 존의 분할 표지.
 * imageSrc가 있으면 사진, 없으면 primary 컬러 존 + 액센트 오브로 폴백(사진 없이도 완결).
 */
export const heroImageLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'hero-image',
  name: '히어로 이미지',
  description:
    '표지·섹션 도입용 분할 히어로. 좌측에 제목/부제, 우측에 대형 이미지 존. 사진이 없으면 컬러 블록으로 대체되어 표지로 손색없다. 강렬한 첫 화면이 필요할 때.',
  contentSchema,
  build: (c): LayoutResult => {
    const zoneX = 680
    const zoneW = 600
    const els: SlideElement[] = []
    if (c.imageSrc) {
      els.push(image('hero-img', c.imageSrc, { x: zoneX, y: 0, w: zoneW, h: 720 }, { fit: 'cover', alt: c.title }))
    } else {
      els.push(
        rect('hero-zone', { x: zoneX, y: 0, w: zoneW, h: 720 }, 'token:colors.primary'),
        ellipse('hero-orb1', { x: 760, y: 60, w: 440, h: 440 }, 'token:colors.accent', 0.28),
        ellipse('hero-orb2', { x: 940, y: 380, w: 300, h: 300 }, 'token:colors.accent', 0.16),
      )
    }
    if (c.eyebrow) {
      els.push(
        text('hero-eyebrow', 'caption', clampText(c.eyebrow, 28), { x: 80, y: 228, w: 540, h: 28 }, {
          color: 'token:colors.accent',
          fontWeight: 'semibold',
        }),
      )
    }
    els.push(
      rect('hero-rule', { x: 80, y: 270, w: 56, h: 5 }, 'token:colors.accent', 2),
      text('hero-title', 'display', clampText(c.title, 80), { x: 80, y: 296, w: 544, h: 230 }, {
        color: 'token:colors.textPrimary',
        fontWeight: 'bold',
        fontSize: 52,
        lineHeight: 1.1,
      }),
    )
    if (c.subtitle) {
      els.push(
        text('hero-sub', 'body', clampText(c.subtitle, 140), { x: 80, y: 536, w: 520, h: 110 }, {
          color: 'token:colors.textSecondary',
          lineHeight: 1.5,
        }),
      )
    }
    return { background: { kind: 'color', color: 'token:colors.background' }, elements: els }
  },
}

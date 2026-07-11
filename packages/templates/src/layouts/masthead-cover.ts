import { z } from 'zod'
import type { SlideElement } from '@im-ppt/schema'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, rect, text } from './helpers.js'

const contentSchema = z.object({
  title: z.string().min(1).max(18),
  tag: z.string().max(28).optional(),
  photo: z.boolean().optional(), // true면 우상단 사진 플레이스홀더
  dark: z.boolean().optional(), // true면 다크 풀블리드 배경(잉크)+라이트 텍스트 (HASU류 검정 마스트헤드)
  meta: z.array(z.string().min(1).max(28)).max(4).optional(),
})

/**
 * 매거진 마스트헤드 표지 — 편집 디자인(이력서·포트폴리오·룩북)의 첫 장.
 * 거대한 타이포(모서리 정렬)+우상단 사진 블록+하단 메타 행. RE-SUME류 재현.
 * 거대 헤딩은 role 'title'(display 아님)이라 디자인 시스템 block 액센트가 덮지 않는다(원본은 순수 텍스트).
 */
export const mastheadCoverLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'masthead-cover',
  name: '매거진 마스트헤드 표지',
  description:
    '거대한 타이포 마스트헤드 표지. 화면을 압도하는 제목(모서리 정렬)+우상단 사진 블록+하단 메타 행. 이력서·포트폴리오·룩북·매거진의 첫 장.',
  contentSchema,
  build: (c): LayoutResult => {
    const els: SlideElement[] = []
    // 다크 마스트헤드(HASU/PROJECT PROPOSAL류): 잉크 배경 + 라이트 텍스트
    const ink = c.dark === true
    const fg = ink ? 'token:colors.background' : 'token:colors.textPrimary'
    const fgSub = ink ? 'token:colors.secondary' : 'token:colors.textSecondary'
    // 우상단 사진 플레이스홀더(원본 대응) — 실 이미지 없으면 회색 블록(템플릿 팩 관례)
    if (c.photo !== false) {
      els.push(rect('mh-photo', { x: 744, y: 56, w: CONTENT_W - 744 + MARGIN, h: 300 }, 'token:colors.secondary'))
    }
    // 거대 마스트헤드 — role 'title'로 block 액센트 회피, 순수 대형 텍스트
    els.push(
      text('mh-title', 'title', clampText(c.title, 18), { x: MARGIN, y: 132, w: 672, h: 316 }, {
        color: fg,
        fontWeight: 'bold',
        fontSize: 112,
        lineHeight: 0.92,
      }),
    )
    if (c.tag) {
      els.push(
        text('mh-tag', 'caption', clampText(c.tag, 28), { x: MARGIN + 4, y: 476, w: 500, h: 26 }, {
          color: fgSub,
          fontWeight: 'semibold',
          fontSize: 15,
        }),
      )
    }
    if (c.meta && c.meta.length > 0) {
      const items = c.meta.slice(0, 4)
      const cellW = CONTENT_W / items.length
      els.push(rect('mh-metaline', { x: MARGIN, y: 600, w: CONTENT_W, h: 2 }, fg))
      items.forEach((m, i) => {
        els.push(
          text(`mh-meta-${i}`, 'caption', clampText(m, 28), { x: MARGIN + i * cellW, y: 620, w: cellW - 16, h: 40 }, {
            color: fg,
            fontWeight: 'medium',
            fontSize: 14,
          }),
        )
      })
    }
    return {
      background: { kind: 'color', color: ink ? 'token:colors.textPrimary' : 'token:colors.background' },
      elements: els,
    }
  },
}

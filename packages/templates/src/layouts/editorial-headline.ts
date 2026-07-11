import { z } from 'zod'
import type { SlideElement } from '@im-ppt/schema'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, rect, text, ellipse, bulletList } from './helpers.js'

const contentSchema = z.object({
  heading: z.string().min(1).max(24),
  badge: z.string().max(2).optional(), // 원형 배지 안 글자 A/B/C 또는 1/2
  number: z.string().max(3).optional(), // 우하단 대형 숫자
  label: z.string().max(40).optional(), // "COMPANY NAME HERE 2022-2023" 류
  body: z.string().max(320).optional(),
  bullets: z.array(z.string().min(1).max(80)).max(5).optional(),
  photo: z.boolean().optional(),
})

/**
 * 에디토리얼 헤드라인 — 매거진형 편집 팩(이력서·포트폴리오)의 내부 장.
 * 상단: 좌측 사진 블록 + 우측 라벨/본문/불릿 + 우상단 원형 배지.
 * 하단: 화면을 가로지르는 거대 헤딩(모서리 정렬) + 우하단 대형 숫자.
 * 거대 헤딩은 role 'title'(display 아님)이라 block 액센트가 덮지 않는다(원본은 순수 대형 텍스트).
 */
export const editorialHeadlineLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'editorial-headline',
  name: '에디토리얼 헤드라인',
  description:
    '매거진형 편집 슬라이드. 좌측 사진 블록+우측 라벨/본문/불릿+우상단 원형 배지, 하단을 가로지르는 거대 헤딩과 대형 숫자. 이력서·포트폴리오·룩북 내부 장.',
  contentSchema,
  build: (c): LayoutResult => {
    const els: SlideElement[] = []
    const hasPhoto = c.photo !== false
    // 좌측 사진 플레이스홀더
    if (hasPhoto) {
      els.push(rect('eh-photo', { x: MARGIN, y: 72, w: 380, h: 300 }, 'token:colors.secondary'))
    }
    const colX = hasPhoto ? MARGIN + 380 + 44 : MARGIN
    const colW = 1280 - MARGIN - colX - (c.badge ? 96 : 0)
    // 우상단 원형 배지(A/B/1 등)
    if (c.badge) {
      els.push(ellipse('eh-badge', { x: 1280 - MARGIN - 76, y: 72, w: 76, h: 76 }, 'token:colors.textPrimary'))
      els.push(
        text('eh-badge-t', 'caption', c.badge, { x: 1280 - MARGIN - 76, y: 86, w: 76, h: 48 }, {
          color: 'token:colors.background',
          fontWeight: 'bold',
          fontSize: 34,
          align: 'center',
        }),
      )
    }
    // 라벨 + 하단 구분선
    let cursorY = 88
    if (c.label) {
      els.push(
        text('eh-label', 'caption', clampText(c.label, 40), { x: colX, y: cursorY, w: colW, h: 26 }, {
          color: 'token:colors.accent',
          fontWeight: 'semibold',
          fontSize: 16,
        }),
      )
      els.push(rect('eh-labelline', { x: colX, y: cursorY + 34, w: colW, h: 1 }, 'token:colors.textPrimary'))
      cursorY += 56
    }
    if (c.body) {
      els.push(
        text('eh-body', 'body', clampText(c.body, 320), { x: colX, y: cursorY, w: colW, h: 200 }, {
          color: 'token:colors.textSecondary',
          lineHeight: 1.55,
        }),
      )
    } else if (c.bullets && c.bullets.length > 0) {
      els.push(
        bulletList('eh-bullets', c.bullets.slice(0, 5), { x: colX, y: cursorY, w: colW, h: 220 }, 'dash', {
          color: 'token:colors.textPrimary',
          fontSize: 17,
          lineHeight: 1.5,
        }),
      )
    }
    // 하단 가로 구분선
    els.push(rect('eh-baseline', { x: MARGIN, y: 452, w: CONTENT_W, h: 2 }, 'token:colors.textPrimary'))
    // 거대 헤딩(모서리 정렬) — role 'title'로 block 회피
    els.push(
      text('eh-heading', 'title', clampText(c.heading, 24), { x: MARGIN, y: 470, w: c.number ? 900 : CONTENT_W, h: 150 }, {
        color: 'token:colors.textPrimary',
        fontWeight: 'bold',
        fontSize: 96,
        lineHeight: 0.95,
      }),
    )
    // 우하단 대형 숫자
    if (c.number) {
      els.push(
        text('eh-number', 'subtitle', c.number, { x: 1010, y: 452, w: 190, h: 168 }, {
          color: 'token:colors.accent',
          fontWeight: 'bold',
          fontSize: 150,
          align: 'right',
          lineHeight: 1,
        }),
      )
    }
    return { background: { kind: 'color', color: 'token:colors.background' }, elements: els }
  },
}

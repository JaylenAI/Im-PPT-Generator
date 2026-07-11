import { z } from 'zod'
import type { SlideElement } from '@im-ppt/schema'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, rect, text } from './helpers.js'

const contentSchema = z.object({
  kicker: z.string().max(28).optional(),
  title: z.string().min(1).max(20), // 1행(잉크색)
  accent: z.string().max(20).optional(), // 2행(액센트색) — 투톤 마스트헤드
  tagline: z.string().max(72).optional(),
  year: z.string().max(6).optional(),
  meta: z.array(z.string().min(1).max(30)).max(3).optional(),
})

/**
 * 리포트/비즈니스 플랜 표지 — 좌측 투톤 타이틀(잉크+액센트 2행)+태그라인+하단 메타,
 * 우측 이미지 블록+연도 배지. 비즈니스 플랜·제안서·연차보고서의 첫 장(BUSINESS PLAN류).
 * 두 타이틀 행은 title/subtitle role로 분리 → 하나의 대형 투톤 헤딩처럼 보이되 block 액센트 회피.
 */
export const reportCoverLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'report-cover',
  name: '리포트 표지',
  description:
    '좌측 투톤 대형 타이틀(잉크+액센트 2행)과 태그라인·하단 메타, 우측 이미지 블록과 연도 배지. 비즈니스 플랜·제안서·연차보고서의 첫 장.',
  contentSchema,
  build: (c): LayoutResult => {
    const imgX = 764
    const leftW = imgX - MARGIN - 40
    const els: SlideElement[] = [
      // 우측 이미지 플레이스홀더
      rect('rp-photo', { x: imgX, y: 72, w: 1280 - MARGIN - imgX, h: 500 }, 'token:colors.secondary'),
    ]
    // 연도 배지(이미지 좌상단에 겹침)
    if (c.year) {
      els.push(rect('rp-yearbg', { x: imgX, y: 72, w: 108, h: 64 }, 'token:colors.accent'))
      els.push(
        text('rp-year', 'caption', clampText(c.year, 6), { x: imgX, y: 90, w: 108, h: 30 }, {
          color: 'token:colors.background',
          fontWeight: 'bold',
          fontSize: 22,
          align: 'center',
        }),
      )
    }
    let y = 120
    if (c.kicker) {
      els.push(rect('rp-kmark', { x: MARGIN, y: y + 4, w: 26, h: 8 }, 'token:colors.accent'))
      els.push(
        text('rp-kicker', 'caption', clampText(c.kicker, 28), { x: MARGIN + 38, y, w: leftW - 38, h: 24 }, {
          color: 'token:colors.textSecondary',
          fontWeight: 'semibold',
          fontSize: 15,
        }),
      )
      y += 52
    }
    // 투톤 타이틀 — 1행 잉크
    els.push(
      text('rp-title', 'title', clampText(c.title, 20), { x: MARGIN, y, w: leftW, h: 92 }, {
        color: 'token:colors.textPrimary',
        fontWeight: 'bold',
        fontSize: 76,
        lineHeight: 0.98,
      }),
    )
    y += 82
    // 2행 액센트(선택) — 없으면 타이틀만
    if (c.accent) {
      els.push(
        text('rp-accent', 'subtitle', clampText(c.accent, 20), { x: MARGIN, y, w: leftW, h: 92 }, {
          color: 'token:colors.accent',
          fontWeight: 'bold',
          fontSize: 76,
          lineHeight: 0.98,
        }),
      )
      y += 96
    } else {
      y += 8
    }
    if (c.tagline) {
      els.push(
        text('rp-tagline', 'body', clampText(c.tagline, 72), { x: MARGIN, y, w: leftW, h: 60 }, {
          color: 'token:colors.textSecondary',
          lineHeight: 1.5,
        }),
      )
    }
    if (c.meta && c.meta.length > 0) {
      const items = c.meta.slice(0, 3)
      els.push(rect('rp-metaline', { x: MARGIN, y: 600, w: CONTENT_W, h: 2 }, 'token:colors.textPrimary'))
      const cellW = CONTENT_W / items.length
      items.forEach((m, i) => {
        els.push(
          text(`rp-meta-${i}`, 'caption', clampText(m, 30), { x: MARGIN + i * cellW, y: 620, w: cellW - 16, h: 40 }, {
            color: 'token:colors.textPrimary',
            fontWeight: 'medium',
            fontSize: 14,
          }),
        )
      })
    }
    return { background: { kind: 'color', color: 'token:colors.background' }, elements: els }
  },
}

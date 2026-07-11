import { z } from 'zod'
import type { Frame, SlideElement } from '@im-ppt/schema'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { text } from './helpers.js'

const contentSchema = z.object({
  kicker: z.string().max(28).optional(),
  title: z.string().min(1).max(28),
  subtitle: z.string().max(80).optional(),
})

/** 스트로크 원(테두리만) — 헬퍼는 fill 전용이라 여기서 직접 구성 */
function ring(id: string, cx: number, cy: number, r: number, color: string, width: number, opacity: number): SlideElement {
  const frame: Frame = { x: cx - r, y: cy - r, w: r * 2, h: r * 2 }
  return { id, type: 'shape', shape: 'ellipse', frame, stroke: { color, width }, rotation: 0, opacity, locked: false }
}

/**
 * 링 표지 — 풀블리드 브랜드 컬러 배경 + 동심원 라인 모티프 + 중앙 타이포.
 * 크리에이티브/에이전시 프레젠테이션의 임팩트 첫 장(FASTPPT COMPANY류).
 * 배경은 solid gradient(from=to=primary)로 반환 → 디자인 시스템 그라데이션 오버라이드에 안전.
 */
export const ringCoverLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'ring-cover',
  name: '링 표지',
  description:
    '풀블리드 브랜드 컬러 배경에 동심원 라인 모티프와 중앙 정렬 대형 타이포. 크리에이티브·에이전시 프레젠테이션의 임팩트 있는 첫 장.',
  contentSchema,
  build: (c): LayoutResult => {
    const line = 'token:colors.background'
    const els: SlideElement[] = [
      // 중앙 우측에 몰린 동심원(원본 08의 오프센터 링 모티프)
      ring('rc-ring1', 780, 360, 300, line, 2, 0.22),
      ring('rc-ring2', 780, 360, 230, line, 2, 0.16),
      ring('rc-ring3', 500, 360, 340, line, 2, 0.12),
    ]
    let y = 250
    if (c.kicker) {
      els.push(
        text('rc-kicker', 'caption', clampText(c.kicker, 28), { x: 240, y, w: 800, h: 28 }, {
          color: 'token:colors.background',
          fontWeight: 'semibold',
          fontSize: 18,
          align: 'center',
        }),
      )
      y += 44
    }
    // 중앙 대형 타이틀 — role 'title'(block 회피), 밝은 텍스트
    els.push(
      text('rc-title', 'title', clampText(c.title, 28), { x: 140, y, w: 1000, h: 120 }, {
        color: 'token:colors.background',
        fontWeight: 'bold',
        fontSize: 88,
        align: 'center',
        lineHeight: 1,
      }),
    )
    y += 128
    if (c.subtitle) {
      els.push(
        text('rc-subtitle', 'subtitle', clampText(c.subtitle, 80), { x: 240, y, w: 800, h: 40 }, {
          color: 'token:colors.background',
          fontSize: 22,
          align: 'center',
        }),
      )
    }
    return {
      background: { kind: 'gradient', from: 'token:colors.primary', to: 'token:colors.primary', angle: 135 },
      elements: els,
    }
  },
}

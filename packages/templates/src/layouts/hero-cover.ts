import { z } from 'zod'
import type { SlideElement } from '@im-ppt/schema'
import type { LayoutDefinition, LayoutResult } from './types.js'
import { clampText } from './types.js'
import { MARGIN, rect, text } from './helpers.js'

const contentSchema = z.object({
  kicker: z.string().max(32).optional(),
  title: z.string().min(1).max(44),
  subtitle: z.string().max(120).optional(),
})

/**
 * 히어로 표지 — 브랜드 컬러(primary)로 화면 전체를 채운 강렬한 첫 장.
 * 원본이 풀블리드 컬러/다크 표지인 팩(오렌지 COMPANY·네이비 블루프린트·인디고 딥 등)의
 * 정체성을 살린다. 배경은 gradient(from=to=primary)로 반환 → 디자인 시스템의
 * gradient 배경 오버라이드(color만 덮음)를 회피하고, exporter는 from색으로 솔리드 렌더.
 * 텍스트는 colors.background(라이트)로 대비 확보(대형 display 기준 AA-large 충족).
 */
export const heroCoverLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'hero-cover',
  name: '히어로 표지',
  description:
    '브랜드 컬러로 화면 전체를 채운 풀블리드 표지. 상단 키커·거대한 제목·부제를 라이트 텍스트로. 강렬한 첫인상이 필요한 회사소개·제안서·피치덱 표지에 사용.',
  contentSchema,
  build: (c): LayoutResult => {
    const els: SlideElement[] = []
    if (c.kicker) {
      els.push(rect('hc-kickrule', { x: MARGIN, y: 190, w: 44, h: 4 }, 'token:colors.background', 2))
      els.push(
        text('hc-kicker', 'caption', clampText(c.kicker, 32), { x: MARGIN + 60, y: 178, w: 900, h: 28 }, {
          color: 'token:colors.background',
          fontWeight: 'semibold',
          fontSize: 16,
        }),
      )
    }
    // display 타이틀 — 시스템 titleAccent(block/underline/sidebar)은 accent(=primary)로 그려져
    // primary 채움 위에서 사실상 사라진다(간섭 없음). 색은 라이트로 명시(모든 시스템 공통 가독).
    els.push(
      text('hc-title', 'display', clampText(c.title, 44), { x: MARGIN, y: c.kicker ? 268 : 250, w: 1120, h: 200 }, {
        color: 'token:colors.background',
        fontWeight: 'bold',
        fontSize: 78,
        lineHeight: 1.04,
      }),
    )
    if (c.subtitle) {
      els.push(
        text('hc-subtitle', 'subtitle', clampText(c.subtitle, 120), { x: MARGIN, y: 500, w: 1000, h: 88 }, {
          color: 'token:colors.background',
          fontSize: 24,
          lineHeight: 1.5,
        }),
      )
    }
    // from=to=primary → 솔리드 채움 + kind:'gradient'라 시스템 배경 오버라이드 비대상
    return {
      background: { kind: 'gradient', from: 'token:colors.primary', to: 'token:colors.primary', angle: 135 },
      elements: els,
    }
  },
}

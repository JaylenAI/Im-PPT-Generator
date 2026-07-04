import { z } from 'zod'
import type { LayoutDefinition } from './types.js'
import { clampText } from './types.js'
import { MARGIN, CONTENT_W, bulletList, rect, text } from './helpers.js'

/** 출처 슬라이드 — 시스템 전용(LLM 카탈로그 숨김). 인용된 소스를 번호 리스트로 렌더 */
const contentSchema = z.object({
  title: z.string().min(1).max(40).default('출처'),
  items: z.array(z.string().min(1).max(160)).min(1).max(12),
})

export const referencesLayout: LayoutDefinition<typeof contentSchema> = {
  key: 'references',
  name: '출처',
  description: '인용된 소스 목록(시스템 자동 생성). 할루시네이션 제로 — 근거 역추적.',
  hidden: true,
  contentSchema,
  build: (c) => ({
    background: { kind: 'color', color: 'token:colors.background' },
    elements: [
      text('ref-title', 'title', clampText(c.title, 40), { x: MARGIN, y: 70, w: CONTENT_W, h: 56 }, {
        color: 'token:colors.textPrimary',
        fontWeight: 'bold',
      }),
      rect('ref-underline', { x: MARGIN, y: 136, w: 64, h: 6 }, 'token:colors.primary', 3),
      bulletList(
        'ref-list',
        c.items.map((it) => clampText(it, 160)),
        { x: MARGIN, y: 180, w: CONTENT_W, h: 460 },
        'number',
        { color: 'token:colors.textSecondary', lineHeight: 1.6, fontSize: 20 },
      ),
    ],
  }),
}

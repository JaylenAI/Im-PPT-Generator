import { defineConfig } from 'vitest/config'

/**
 * 루트 vitest 설정 — 워크스페이스 전체를 한 번에 돌릴 때(vitest run) 사용.
 * Playwright e2e(*.spec.ts in e2e/)는 vitest가 아니라 playwright로 실행하므로 제외.
 */
export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
  },
})

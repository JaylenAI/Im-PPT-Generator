import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // 통합 테스트(실 claude CLI)는 별도 실행: RUN_LLM_INTEGRATION=1
    testTimeout: 120_000,
  },
})

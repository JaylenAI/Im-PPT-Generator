import { defineConfig } from '@playwright/test'

/**
 * 웹 E2E — 실 api(실 claude) + vite dev 서버를 띄우고 브라우저로 검증.
 * 게이트 미리보기(outline/plans)는 DB가 불필요하므로 api는 인메모리로 기동.
 * 생성은 실 claude를 호출하므로 타임아웃을 넉넉히.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 60_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5273',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node --import tsx src/index.ts',
      cwd: '../api',
      port: 8787,
      env: { PORT: '8787', LOG_LEVEL: 'warn' },
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'pnpm dev',
      port: 5273,
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
})

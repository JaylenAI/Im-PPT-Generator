import { serve } from '@hono/node-server'
import { createDb, ensureSchema, PgDeckStore, PgJobStore, PgSettingsStore } from '@im-ppt/db'
import { createTavilyAdapter, createSerperAdapter } from '@im-ppt/research'
import { createPexelsAdapter, createUnsplashAdapter } from './lib/stock.js'
import { createApp } from './app.js'
import { createDefaultDeps } from './deps.js'
import { createWorker } from './lib/worker.js'
import { SettingsService } from './lib/settings-service.js'
import { loadEnv } from './config/env.js'
import { createLogger } from './lib/logger.js'

const env = loadEnv()
const logger = createLogger(env.LOG_LEVEL)

const deps = createDefaultDeps()
// 웹 검색 어댑터 — 키 있으면 배선(Tavily 우선, Serper 폴백). 없으면 유저 자료만.
if (env.TAVILY_API_KEY) {
  deps.search = createTavilyAdapter({ apiKey: env.TAVILY_API_KEY })
  logger.info('리서치 검색 어댑터: Tavily')
} else if (env.SERPER_API_KEY) {
  deps.search = createSerperAdapter({ apiKey: env.SERPER_API_KEY })
  logger.info('리서치 검색 어댑터: Serper')
}
// 스톡 이미지 어댑터 — 키 있으면 배선(Pexels 우선, Unsplash 폴백). 없으면 컬러 존 폴백.
if (env.PEXELS_API_KEY) {
  deps.stockImages = createPexelsAdapter({ apiKey: env.PEXELS_API_KEY })
  logger.info('스톡 이미지 어댑터: Pexels')
} else if (env.UNSPLASH_ACCESS_KEY) {
  deps.stockImages = createUnsplashAdapter({ apiKey: env.UNSPLASH_ACCESS_KEY })
  logger.info('스톡 이미지 어댑터: Unsplash')
}
// DATABASE_URL 있으면 Postgres 영속으로 교체(덱·잡·설정이 재시작에도 살아남음)
if (env.DATABASE_URL) {
  const handle = createDb(env.DATABASE_URL)
  await ensureSchema(handle)
  deps.decks = new PgDeckStore(handle.db, env.WORKSPACE_ID)
  deps.jobs = new PgJobStore(handle.db, env.WORKSPACE_ID)
  deps.settings = new SettingsService(new PgSettingsStore(handle.db, env.WORKSPACE_ID), deps.prompts)
  logger.info('Postgres 덱·잡·설정 저장소 연결', { workspace: env.WORKSPACE_ID })
} else {
  logger.warn('DATABASE_URL 없음 — 인메모리 저장소(재시작 시 덱·잡·설정 소실)')
}
// 설정 rehydrate — DB의 앱 기본값·프롬프트 오버라이드를 메모리로 복원(핫리로드 기반)
await deps.settings.hydrate()

// 워커 — 라우트 kick + 백그라운드 루프(재시도/백오프/크래시 복구). 기동 시에만 loop 시작
const worker = createWorker(deps, { onError: (e) => logger.error('워커 처리 오류', { message: e.message }) })
const app = createApp(deps, worker, env)
worker.start()

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info('im-ppt-api 기동(워커 가동)', { port: info.port })
})

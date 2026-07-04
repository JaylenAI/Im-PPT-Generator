import { serve } from '@hono/node-server'
import { createDb, ensureSchema, PgDeckStore, PgJobStore } from '@im-ppt/db'
import { createApp } from './app.js'
import { createDefaultDeps } from './deps.js'
import { createWorker } from './lib/worker.js'
import { loadEnv } from './config/env.js'
import { createLogger } from './lib/logger.js'

const env = loadEnv()
const logger = createLogger(env.LOG_LEVEL)

const deps = createDefaultDeps()
// DATABASE_URL 있으면 Postgres 영속으로 교체(덱·잡이 재시작에도 살아남음)
if (env.DATABASE_URL) {
  const handle = createDb(env.DATABASE_URL)
  await ensureSchema(handle)
  deps.decks = new PgDeckStore(handle.db, env.WORKSPACE_ID)
  deps.jobs = new PgJobStore(handle.db, env.WORKSPACE_ID)
  logger.info('Postgres 덱·잡 저장소 연결', { workspace: env.WORKSPACE_ID })
} else {
  logger.warn('DATABASE_URL 없음 — 인메모리 저장소(재시작 시 덱·잡 소실)')
}

// 워커 — 라우트 kick + 백그라운드 루프(재시도/백오프/크래시 복구). 기동 시에만 loop 시작
const worker = createWorker(deps, { onError: (e) => logger.error('워커 처리 오류', { message: e.message }) })
const app = createApp(deps, worker)
worker.start()

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info('im-ppt-api 기동(워커 가동)', { port: info.port })
})

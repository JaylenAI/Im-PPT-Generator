import { serve } from '@hono/node-server'
import { createDb, ensureSchema, PgDeckStore } from '@im-ppt/db'
import { createApp } from './app.js'
import { createDefaultDeps } from './deps.js'
import { loadEnv } from './config/env.js'
import { createLogger } from './lib/logger.js'

const env = loadEnv()
const logger = createLogger(env.LOG_LEVEL)

const deps = createDefaultDeps()
// DATABASE_URL 있으면 Postgres 영속으로 교체(덱이 재시작에도 살아남음)
if (env.DATABASE_URL) {
  const handle = createDb(env.DATABASE_URL)
  await ensureSchema(handle)
  deps.decks = new PgDeckStore(handle.db, env.WORKSPACE_ID)
  logger.info('Postgres 덱 저장소 연결', { workspace: env.WORKSPACE_ID })
} else {
  logger.warn('DATABASE_URL 없음 — 인메모리 저장소(재시작 시 덱 소실)')
}

const app = createApp(deps)
serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info('im-ppt-api 기동', { port: info.port })
})

import { Hono } from 'hono'
import { healthRoutes } from './routes/health.js'
import { deckRoutes } from './routes/decks.js'
import { exportRoutes } from './routes/exports.js'
import { catalogRoutes } from './routes/catalog.js'
import { settingsRoutes } from './routes/settings.js'
import { streamRoutes } from './routes/stream.js'
import { createDefaultDeps, type AppDeps } from './deps.js'
import { createWorker, type Worker } from './lib/worker.js'

/**
 * 앱 팩토리 — 서버 기동과 분리해 테스트에서 app.request()로 직접 검증.
 * deps 주입으로 라우트를 오프라인 테스트 가능(가짜 프로바이더). 도메인 라우터만 마운트.
 * worker는 라우트의 kick(processOne)용 — 백그라운드 루프 start()는 기동 시(index.ts)에만.
 */
export function createApp(deps: AppDeps = createDefaultDeps(), worker: Worker = createWorker(deps)) {
  const app = new Hono().basePath('/api/v1')

  app.route('/health', healthRoutes)
  app.route('/decks', deckRoutes(deps))
  app.route('/', streamRoutes(deps, worker)) // /decks/stream, /decks/generate, /jobs/:id (SSE 잡큐)
  app.route('/', exportRoutes(deps)) // /decks/:id/export, /exports/:id/download
  app.route('/', catalogRoutes) // /templates, /themes, /layouts
  app.route('/settings', settingsRoutes(deps))

  app.notFound((c) =>
    c.json({ error: { code: 'NOT_FOUND', message: '요청한 리소스를 찾을 수 없습니다' } }, 404),
  )

  app.onError((err, c) => {
    process.stderr.write(`[api error] ${err.stack ?? err.message}\n`)
    return c.json({ error: { code: 'INTERNAL', message: err.message } }, 500)
  })

  return app
}

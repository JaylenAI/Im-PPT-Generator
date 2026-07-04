import { Hono } from 'hono'
import { healthRoutes } from './routes/health.js'

/**
 * 앱 팩토리 — 서버 기동과 분리해 테스트에서 app.request()로 직접 검증.
 * 도메인 라우터는 여기서만 마운트한다(모놀리식 라우트 파일 금지).
 */
export function createApp() {
  const app = new Hono().basePath('/api/v1')

  app.route('/health', healthRoutes)

  app.notFound((c) =>
    c.json({ error: { code: 'NOT_FOUND', message: '요청한 리소스를 찾을 수 없습니다' } }, 404),
  )

  app.onError((err, c) =>
    c.json({ error: { code: 'INTERNAL', message: err.message } }, 500),
  )

  return app
}

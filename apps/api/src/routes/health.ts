import { Hono } from 'hono'

export const healthRoutes = new Hono().get('/', (c) =>
  c.json({ data: { status: 'ok', service: 'im-ppt-api' } }),
)

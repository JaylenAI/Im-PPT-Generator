import { serve } from '@hono/node-server'
import { createApp } from './app.js'
import { loadEnv } from './config/env.js'
import { createLogger } from './lib/logger.js'

const env = loadEnv()
const logger = createLogger(env.LOG_LEVEL)
const app = createApp()

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info('im-ppt-api 기동', { port: info.port })
})

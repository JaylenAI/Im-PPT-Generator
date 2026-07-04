import { z } from 'zod'

/** 환경 설정 — 모든 값은 여기서만 읽는다(코드 내 process.env 직접 접근 금지) */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  /** 있으면 Postgres 영속, 없으면 인메모리 폴백 */
  DATABASE_URL: z.string().optional(),
  WORKSPACE_ID: z.string().default('default'),
  /** 웹 검색(리서치) — 있으면 web/deep 모드에서 사용. Tavily 우선, Serper 폴백 */
  TAVILY_API_KEY: z.string().optional(),
  SERPER_API_KEY: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source)
  if (!parsed.success) {
    throw new Error(`환경 변수 검증 실패: ${parsed.error.message}`)
  }
  return parsed.data
}

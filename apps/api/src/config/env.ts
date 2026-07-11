import { z } from 'zod'

/** 환경 설정 — 모든 값은 여기서만 읽는다(코드 내 process.env 직접 접근 금지) */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8788),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  /** PDF/PNG export용 헤드리스 렌더 대상 — 실행 중인 웹 오리진(/print 라우트 사용) */
  WEB_ORIGIN: z.string().url().default('http://localhost:5273'),
  /** 있으면 Postgres 영속, 없으면 인메모리 폴백 */
  DATABASE_URL: z.string().optional(),
  WORKSPACE_ID: z.string().default('default'),
  /** 웹 검색(리서치) — 있으면 web/deep 모드에서 사용. Tavily 우선, Serper 폴백 */
  TAVILY_API_KEY: z.string().optional(),
  SERPER_API_KEY: z.string().optional(),
  /** 스톡 이미지(P12) — 있으면 에디터 "스톡" 피커에서 실사진 검색·삽입. Pexels 우선, Unsplash 폴백 */
  PEXELS_API_KEY: z.string().optional(),
  UNSPLASH_ACCESS_KEY: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source)
  if (!parsed.success) {
    throw new Error(`환경 변수 검증 실패: ${parsed.error.message}`)
  }
  return parsed.data
}

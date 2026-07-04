import { z } from 'zod'
import { modelParamsSchema } from './params.js'

/** 파이프라인 작업 종류 — 모델 라우팅의 태그(GC-Agent chat/embed/vlm → 우리 도메인) */
export const modelTaskSchema = z.enum(['outline', 'slide', 'edit', 'research', 'vision', 'image'])
export type ModelTask = z.infer<typeof modelTaskSchema>

/** 프로바이더 종류 — base_url 추론 대신 명시(ADR: GC-Agent의 substring 취약점 회피) */
export const providerKindSchema = z.enum(['claude-cli', 'anthropic-api', 'openai-compat', 'gemini'])
export type ProviderKind = z.infer<typeof providerKindSchema>

/**
 * 모델 연결 = 모델 설정의 단일 진실(SoT). GC-Agent model_connections 미러링.
 * P1은 파일/인메모리 카탈로그, P2에서 DB row로 이관(동일 shape).
 */
export const modelConnectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  provider: providerKindSchema,
  /** 프로바이더 내 모델 식별자(claude-cli는 'sonnet'/'opus' 별칭 허용) */
  model: z.string().min(1),
  /** base_url/apiKey는 claude-cli엔 불필요, api/openai-compat에 필요 */
  baseUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  /** 이 연결이 담당 가능한 작업들 */
  tags: z.array(modelTaskSchema).min(1),
  params: modelParamsSchema.prefault({}),
  isActive: z.boolean().default(true),
})
export type ModelConnection = z.infer<typeof modelConnectionSchema>

export interface GenerateRequest {
  prompt: string
  /** z.toJSONSchema로 변환된 출력 스키마 */
  schemaJson: Record<string, unknown>
  connection: ModelConnection
}

export interface GenerateUsage {
  inputTokens?: number
  outputTokens?: number
  costUsd?: number
  model?: string
}

export interface GenerateResult {
  /** 프로바이더가 반환한 구조화 출력(스키마 검증 전 raw) */
  data: unknown
  usage?: GenerateUsage
}

/** 프로바이더 어댑터 계약 — 새 프로바이더는 이 인터페이스만 구현해 register (분기문 금지) */
export interface ProviderAdapter {
  kind: ProviderKind
  generateStructured(req: GenerateRequest): Promise<GenerateResult>
}

/** 조용한 degrade 금지 — 모델을 못 찾으면 명확히 실패(GC-Agent ModelConnectionMissing) */
export class ModelConnectionMissing extends Error {
  constructor(task: ModelTask, detail: string) {
    super(`작업 '${task}'에 사용할 활성 모델 연결이 없습니다: ${detail}`)
    this.name = 'ModelConnectionMissing'
  }
}

export class ProviderError extends Error {
  constructor(
    public readonly provider: ProviderKind,
    message: string,
  ) {
    super(`[${provider}] ${message}`)
    this.name = 'ProviderError'
  }
}

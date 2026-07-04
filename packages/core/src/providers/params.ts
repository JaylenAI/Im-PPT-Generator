import { z } from 'zod'

/** reasoning/thinking 설정 — 프로바이더 패밀리마다 다른 필드로 번역됨(아래 어댑터) */
export const reasoningParamsSchema = z.object({
  thinking: z.boolean().default(false),
  effort: z.enum(['low', 'medium', 'high']).optional(),
  thinkingTokenBudget: z.number().int().positive().optional(),
})

/**
 * 모델 파라미터 — UI는 이 단일 shape로 저장, 어댑터가 패밀리별 필드로 번역.
 * clamp는 zod로(GC-Agent _validate_model_params 미러링). 알 수 없는 키는 스키마가 drop.
 */
export const modelParamsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().int().min(0).optional(),
  maxTokens: z.number().int().min(1).optional(),
  contextLength: z.number().int().min(1024).optional(),
  reasoning: reasoningParamsSchema.optional(),
  /** admin만 노출(일반 사용자 UI에서 숨김) */
  adminOnly: z.boolean().default(false),
})
export type ModelParams = z.infer<typeof modelParamsSchema>
export type ReasoningParams = z.infer<typeof reasoningParamsSchema>

export type ModelFamily = 'claude' | 'gpt-oss' | 'gemma' | 'qwen' | 'plain'

/** model 식별자 substring으로 패밀리 판정 — 구체적인 것 우선(GC-Agent detect_family) */
export function detectFamily(model: string): ModelFamily {
  const m = model.toLowerCase()
  if (m.includes('claude') || m === 'sonnet' || m === 'opus' || m === 'haiku') return 'claude'
  if (m.includes('gpt-oss')) return 'gpt-oss'
  if (m.includes('gemma')) return 'gemma'
  if (m.includes('qwen')) return 'qwen'
  return 'plain'
}

/**
 * reasoning 설정을 패밀리별 kwargs로 번역. "thinking on/off"의 필드명이 패밀리마다 다른 문제를
 * 한 곳에서 흡수(GC-Agent build_reasoning_kwargs). OpenAI-compat/API 프로바이더가 사용.
 */
export function buildReasoningKwargs(
  model: string,
  reasoning?: ReasoningParams,
): { top: Record<string, unknown>; extraBody: Record<string, unknown> } {
  const top: Record<string, unknown> = {}
  const extraBody: Record<string, unknown> = {}
  if (!reasoning) return { top, extraBody }

  const family = detectFamily(model)
  if (family === 'gpt-oss') {
    if (reasoning.effort) top['reasoning_effort'] = reasoning.effort
    if (!reasoning.thinking) extraBody['include_reasoning'] = false
  } else if (family === 'gemma' || family === 'qwen') {
    const tmpl: Record<string, unknown> = { enable_thinking: reasoning.thinking }
    if (family === 'qwen' && reasoning.thinkingTokenBudget) {
      tmpl['thinking_token_budget'] = reasoning.thinkingTokenBudget
    }
    extraBody['chat_template_kwargs'] = tmpl
  }
  // claude / plain: no-op (claude-cli는 --model만, plain은 미지원)
  return { top, extraBody }
}

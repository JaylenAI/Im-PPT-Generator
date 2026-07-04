import { z } from 'zod'
import { aspectRatioSchema, idSchema } from './primitives.js'

/**
 * 딥서치 강도 — 사용자가 "리서치를 시킬지/얼마나" 고르는 축.
 * off: 리서치 없음(순수 프롬프트 기반) / user_only: 제공 자료만 팩트화(웹서치 스킵)
 * web: 가벼운 웹서치 / deep: 다중 소스 딥리서치 + 교차검증
 */
export const researchModeSchema = z.enum(['off', 'user_only', 'web', 'deep'])
export type ResearchMode = z.infer<typeof researchModeSchema>

export const imageModeSchema = z.enum(['none', 'stock', 'generate', 'mixed'])
export type ImageMode = z.infer<typeof imageModeSchema>

export const toneSchema = z.enum(['formal', 'casual', 'professional', 'academic', 'playful'])

/** HITL 게이트 3종을 독립 토글 — 자율도 레벨은 이 조합의 프리셋일 뿐 */
export const gateConfigSchema = z.object({
  facts: z.boolean().default(false),
  outline: z.boolean().default(true),
  slidePlan: z.boolean().default(false),
})
export type GateConfig = z.infer<typeof gateConfigSchema>

/**
 * 생성 레시피 — 파이프라인 전체를 제어하는 단일 진실.
 * 각 단계는 이 config + 현재 덱 상태를 읽어 실행/스킵을 결정한다(코드에 분기 하드코딩 금지).
 */
export const generationConfigSchema = z.object({
  prompt: z.string().min(1),
  slideCount: z.number().int().min(1).max(60).default(12),
  tone: toneSchema.default('professional'),
  audience: z.string().max(120).default(''),
  language: z.string().min(2).default('ko'),
  aspectRatio: aspectRatioSchema.default('16:9'),

  /** 딥서치 강도 (off/user_only/web/deep) */
  researchMode: researchModeSchema.default('web'),

  /** 목차 출처 — user면 생성 단계가 "검증"으로 바뀜(사용자 제공 목차 사용) */
  outlineSource: z.enum(['ai', 'user']).default('ai'),

  /** 제목 방식(ADR-009) — assertion: 결론 문장 헤드라인 / topic: 짧은 주제 라벨 */
  titleMode: z.enum(['assertion', 'topic']).default('assertion'),

  /** 미지정 시 AI가 선택. 사용자가 미리 고르면 그 템플릿/테마로 바로 진행 */
  templateId: idSchema.optional(),
  themeId: idSchema.optional(),

  imageMode: imageModeSchema.default('mixed'),

  /** 사람 개입 지점 */
  gates: gateConfigSchema.prefault({}),
})
export type GenerationConfig = z.infer<typeof generationConfigSchema>

/** 프리셋 = 이름 붙은 config 조각. UI는 이걸 노출하고 "고급"에서 개별 오버라이드 */
export const CONFIG_PRESETS = {
  quick: { researchMode: 'off', gates: { facts: false, outline: false, slidePlan: false } },
  standard: { researchMode: 'web', gates: { facts: false, outline: true, slidePlan: false } },
  research: { researchMode: 'deep', gates: { facts: true, outline: true, slidePlan: false } },
  precision: { researchMode: 'deep', gates: { facts: true, outline: true, slidePlan: true } },
  my_materials: {
    researchMode: 'user_only',
    gates: { facts: false, outline: true, slidePlan: false },
  },
} as const satisfies Record<string, Partial<GenerationConfig>>

export type PresetName = keyof typeof CONFIG_PRESETS

export interface ResolveConfigInput extends Partial<Omit<GenerationConfig, 'gates'>> {
  prompt: string
  preset?: PresetName
  /** 부분 토글 허용 — 지정한 게이트만 바뀌고 나머지는 프리셋값 보존 */
  gates?: Partial<GateConfig>
}

/**
 * 프리셋 + 사용자 오버라이드를 병합해 완전한 config 산출.
 * 오버라이드가 프리셋을 이긴다. gates는 딥머지(부분 토글만 바꿔도 나머지 프리셋값 보존).
 */
export function resolveGenerationConfig(input: ResolveConfigInput): GenerationConfig {
  const { preset, gates: overrideGates, ...overrides } = input
  const base: Partial<GenerationConfig> = preset ? CONFIG_PRESETS[preset] : {}

  const merged: Record<string, unknown> = { ...base }
  for (const [k, v] of Object.entries(overrides)) {
    if (v !== undefined) merged[k] = v
  }
  const mergedGates = { ...(base.gates ?? {}), ...(overrideGates ?? {}) }
  if (Object.keys(mergedGates).length > 0) merged['gates'] = mergedGates

  return generationConfigSchema.parse(merged)
}

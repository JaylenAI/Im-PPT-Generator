import { z } from 'zod'
import { aspectRatioSchema } from './primitives.js'
import { imageModeSchema, toneSchema } from './generation-config.js'

/**
 * 앱 레벨 생성 기본값 — 사용자가 요청에서 명시하지 않은 값의 fallback.
 * 설정 화면에서 편집 → DB 영속 → 다음 생성부터 반영(핫리로드).
 * researchMode/gates는 프리셋이 소유하므로 여기 두지 않는다(충돌 방지) —
 * 리서치 강도는 defaultPreset으로 조절.
 */
export const appSettingsSchema = z.object({
  defaultPreset: z
    .enum(['quick', 'standard', 'research', 'precision', 'my_materials'])
    .default('standard'),
  defaultSlideCount: z.number().int().min(1).max(60).default(12),
  defaultTone: toneSchema.default('professional'),
  defaultLanguage: z.string().min(2).default('ko'),
  defaultAspectRatio: aspectRatioSchema.default('16:9'),
  defaultImageMode: imageModeSchema.default('mixed'),
})
export type AppSettings = z.infer<typeof appSettingsSchema>

/** 설정 UI가 폼을 동적으로 렌더하기 위한 필드 서술자(타입드 카탈로그) */
export interface SettingFieldDescriptor {
  key: keyof AppSettings
  label: string
  type: 'enum' | 'number' | 'string'
  default: string | number
  options?: readonly string[]
  min?: number
  max?: number
  description: string
}

/**
 * 앱 설정 카탈로그 — 필드 메타를 데이터로 선언(프롬프트 카탈로그와 동일 철학).
 * API가 이걸 노출하면 설정 화면은 필드마다 하드코딩 없이 폼을 그린다.
 * appSettingsSchema가 실제 검증의 진실이고, 이 카탈로그는 그 UI 서술이다.
 */
export const APP_SETTINGS_CATALOG: readonly SettingFieldDescriptor[] = [
  {
    key: 'defaultPreset',
    label: '기본 프리셋',
    type: 'enum',
    options: ['quick', 'standard', 'research', 'precision', 'my_materials'],
    default: 'standard',
    description: '생성 위저드의 기본 자율도 프리셋',
  },
  {
    key: 'defaultSlideCount',
    label: '기본 슬라이드 수',
    type: 'number',
    default: 12,
    min: 1,
    max: 60,
    description: '미지정 시 생성할 슬라이드 장수',
  },
  {
    key: 'defaultTone',
    label: '기본 톤',
    type: 'enum',
    options: ['formal', 'casual', 'professional', 'academic', 'playful'],
    default: 'professional',
    description: '문체/어조 기본값',
  },
  {
    key: 'defaultLanguage',
    label: '기본 언어',
    type: 'string',
    default: 'ko',
    description: '생성 언어(ISO 코드 또는 언어명)',
  },
  {
    key: 'defaultAspectRatio',
    label: '기본 화면비',
    type: 'enum',
    options: ['16:9', '4:3', '9:16'],
    default: '16:9',
    description: '슬라이드 화면 비율',
  },
  {
    key: 'defaultImageMode',
    label: '기본 이미지 모드',
    type: 'enum',
    options: ['none', 'stock', 'generate', 'mixed'],
    default: 'mixed',
    description: '이미지 채우기 방식 기본값',
  },
] as const

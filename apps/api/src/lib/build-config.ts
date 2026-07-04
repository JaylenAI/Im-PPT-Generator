import { resolveGenerationConfig, type AppSettings, type GenerationConfig } from '@im-ppt/schema'

/**
 * 생성 config 조립 — 앱 기본값(설정) 아래에 요청 명시값을 얹는다.
 * 층위: 스키마 기본값 < 앱 기본값 < 프리셋(researchMode/gates) < 요청 명시값.
 * 앱 기본값은 프리셋이 소유하지 않는 필드(slideCount/tone/language/화면비/imageMode)만
 * 채우므로 프리셋과 충돌하지 않는다. preset은 요청 > 앱 기본 순으로 선택.
 */
export function buildConfig(app: AppSettings, body: Record<string, unknown>): GenerationConfig {
  const explicit: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (v !== undefined) explicit[k] = v
  }
  const preset = (explicit.preset as string | undefined) ?? app.defaultPreset

  const merged: Record<string, unknown> = {
    slideCount: app.defaultSlideCount,
    tone: app.defaultTone,
    language: app.defaultLanguage,
    aspectRatio: app.defaultAspectRatio,
    imageMode: app.defaultImageMode,
    ...explicit, // 요청 명시값이 앱 기본을 이긴다
    preset,
  }
  return resolveGenerationConfig(merged as { prompt: string })
}

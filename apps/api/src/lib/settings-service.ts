import { appSettingsSchema, brandKitSchema, customTemplateSchema, type AppSettings, type BrandKit, type CustomTemplate } from '@im-ppt/schema'
import { z } from 'zod'
import type { PromptStore } from '@im-ppt/core'
import type { SettingsStore } from '@im-ppt/db'

const APP_KEY = 'app.settings'
const BRAND_KEY = 'brand.kit'
const CUSTOM_TPL_KEY = 'custom.templates'
const PROMPT_PREFIX = 'prompt.'

/**
 * 설정 서비스 — 인메모리 핫 상태(즉시 반영) + DB 영속(재시작 생존)을 합친다.
 * 부팅 시 hydrate로 DB→메모리 복원, 변경 시 메모리+DB 동시 기록.
 * core(PromptStore)는 DB를 모른다(ADR-007) — 영속은 여기서만.
 */
export class SettingsService {
  private app: AppSettings = appSettingsSchema.parse({})
  private brand: BrandKit | null = null
  private customTemplates: CustomTemplate[] = []

  constructor(
    private readonly store: SettingsStore,
    private readonly prompts: PromptStore,
  ) {}

  /** 부팅 시 1회 — DB의 앱 설정·프롬프트 오버라이드·브랜드킷을 메모리로 복원 */
  async hydrate(): Promise<void> {
    const appVal = await this.store.get(APP_KEY)
    if (appVal !== undefined) {
      const parsed = appSettingsSchema.safeParse(appVal)
      if (parsed.success) this.app = parsed.data
    }
    const brandVal = await this.store.get(BRAND_KEY)
    if (brandVal !== undefined) {
      const parsed = brandKitSchema.safeParse(brandVal)
      if (parsed.success) this.brand = parsed.data
    }
    const tplVal = await this.store.get(CUSTOM_TPL_KEY)
    if (tplVal !== undefined) {
      const parsed = z.array(customTemplateSchema).safeParse(tplVal)
      if (parsed.success) this.customTemplates = parsed.data
    }
    const known = new Set(this.prompts.list().map((p) => p.key))
    for (const { key, value } of await this.store.getAll(PROMPT_PREFIX)) {
      const promptKey = key.slice(PROMPT_PREFIX.length)
      if (known.has(promptKey as never) && typeof value === 'string') {
        this.prompts.setOverride(promptKey as never, value)
      }
    }
  }

  getApp(): AppSettings {
    return this.app
  }

  getBrandKit(): BrandKit | null {
    return this.brand
  }

  /** 브랜드킷 설정(부분) — 검증 후 메모리+DB. null이면 해제 */
  async setBrandKit(kit: unknown): Promise<BrandKit> {
    const parsed = brandKitSchema.parse(kit)
    this.brand = parsed
    await this.store.set(BRAND_KEY, parsed)
    return parsed
  }

  /** 커스텀 템플릿(PPTX 추출/사용자 저장) 목록 */
  getCustomTemplates(): CustomTemplate[] {
    return this.customTemplates
  }

  getCustomTemplate(id: string): CustomTemplate | undefined {
    return this.customTemplates.find((t) => t.id === id)
  }

  /** 커스텀 템플릿 추가 — 검증 후 메모리+DB(맨 앞에 최신) */
  async addCustomTemplate(tpl: unknown): Promise<CustomTemplate> {
    const parsed = customTemplateSchema.parse(tpl)
    this.customTemplates = [parsed, ...this.customTemplates.filter((t) => t.id !== parsed.id)]
    await this.store.set(CUSTOM_TPL_KEY, this.customTemplates)
    return parsed
  }

  /** 커스텀 템플릿 삭제 — 있으면 제거 후 영속, 삭제 여부 반환 */
  async removeCustomTemplate(id: string): Promise<boolean> {
    const before = this.customTemplates.length
    this.customTemplates = this.customTemplates.filter((t) => t.id !== id)
    if (this.customTemplates.length === before) return false
    await this.store.set(CUSTOM_TPL_KEY, this.customTemplates)
    return true
  }

  /** 부분 갱신 — 검증 후 병합, 메모리+DB 반영. 갱신된 전체 설정 반환 */
  async patchApp(partial: unknown): Promise<AppSettings> {
    const merged = appSettingsSchema.parse({ ...this.app, ...(partial as object) })
    this.app = merged
    await this.store.set(APP_KEY, merged)
    return merged
  }

  /** 프롬프트 오버라이드 — 메모리(즉시) + DB(영속). 빈 문자열이면 기본값 복귀+DB 삭제 */
  async setPromptOverride(key: string, content: string): Promise<void> {
    this.prompts.setOverride(key as never, content)
    if (content.trim().length === 0) await this.store.delete(PROMPT_PREFIX + key)
    else await this.store.set(PROMPT_PREFIX + key, content)
  }
}

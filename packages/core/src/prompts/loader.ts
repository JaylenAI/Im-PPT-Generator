import { PROMPT_CATALOG, type PromptKey } from './catalog.js'

/**
 * 프롬프트 로더 (GC-Agent prompt_loader 미러링).
 * 오버라이드(사용자 편집) → 카탈로그(기본값) fallback. P1은 인메모리 오버라이드,
 * P2에서 DB + TTL + single-flight로 확장(계약 동일).
 */
export class PromptStore {
  private overrides = new Map<PromptKey, string>()

  /** 빈 문자열 오버라이드는 삭제(=기본값 복귀), GC-Agent PATCH 동작과 동일 */
  setOverride(key: PromptKey, content: string): void {
    if (content.trim().length === 0) this.overrides.delete(key)
    else this.overrides.set(key, content)
  }

  reset(key: PromptKey): void {
    this.overrides.delete(key)
  }

  /** 변수 치환한 최종 프롬프트. 없는 placeholder는 {name} 그대로 둠(KeyError 방지) */
  get(key: PromptKey, vars: Record<string, string | number> = {}): string {
    const template = this.overrides.get(key) ?? PROMPT_CATALOG[key].content
    return safeFormat(template, vars)
  }

  /** 설정 UI용 메타 — 기본값/현재값/오버라이드 여부 */
  list(): Array<{
    key: PromptKey
    description: string
    category: string
    variables: string[]
    defaultContent: string
    currentContent: string
    isOverridden: boolean
  }> {
    return (Object.keys(PROMPT_CATALOG) as PromptKey[]).map((key) => {
      const def = PROMPT_CATALOG[key]
      const override = this.overrides.get(key)
      return {
        key,
        description: def.description,
        category: def.category,
        variables: def.variables,
        defaultContent: def.content,
        currentContent: override ?? def.content,
        isOverridden: override !== undefined,
      }
    })
  }
}

/** {name} 치환. 매칭 안 되는 토큰은 원문 유지(GC-Agent _safe_format) */
export function safeFormat(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  )
}

/**
 * JSON Schema 정제 — claude CLI `--json-schema`는 `$schema`/`default` 키워드가 있으면
 * 구조화 출력을 조용히 포기한다(실측). z.toJSONSchema 출력에서 이들을 재귀 제거한다.
 * (검증된 CLI 호환 형태로 정규화)
 */
const STRIP_KEYS = new Set(['$schema', 'default'])

export function sanitizeJsonSchema(schema: unknown): Record<string, unknown> {
  return deepStrip(schema) as Record<string, unknown>
}

function deepStrip(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(deepStrip)
  if (node && typeof node === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(node)) {
      if (STRIP_KEYS.has(k)) continue
      out[k] = deepStrip(v)
    }
    return out
  }
  return node
}

import type { ModelConnection } from '../providers/types.js'

/**
 * 시크릿 마스킹 (GC-Agent _mask_api_key/_is_masked 미러링).
 * UI로 나갈 때 키를 마스킹하고, 마스킹된 값이 되돌아오면 "변경 없음"으로 취급해
 * UI 왕복으로 키가 파괴되는 버그를 방지한다.
 */

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '***'
  return `${key.slice(0, 4)}…${key.slice(-4)}`
}

/** '…'(U+2026)는 실제 키에 없는 마스킹 신호 → 존재 여부로 판정(prefix 하이픈 등에 견고) */
export function isMaskedApiKey(value: string): boolean {
  return value === '***' || value.includes('…')
}

/** 응답 전 연결의 apiKey를 마스킹 */
export function redactConnection(conn: ModelConnection): ModelConnection {
  if (!conn.apiKey) return conn
  return { ...conn, apiKey: maskApiKey(conn.apiKey) }
}

/**
 * 저장 시 병합 — 들어온 apiKey가 마스킹된 값이면 기존 값 보존, 아니면 교체.
 * (GC-Agent 쓰기 시 마스크 감지 로직)
 */
export function mergeApiKeyOnWrite(
  incoming: string | undefined,
  existing: string | undefined,
): string | undefined {
  if (incoming === undefined) return existing
  if (isMaskedApiKey(incoming)) return existing
  return incoming
}

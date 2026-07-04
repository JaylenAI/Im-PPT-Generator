import { z } from 'zod'
import type { ThemeTokens } from '@im-ppt/schema'
import type { ProviderRegistry } from '../providers/registry.js'
import type { PromptStore } from '../prompts/loader.js'

const svgSchema = z.object({ svg: z.string() })

export interface ImageDeps {
  registry: ProviderRegistry
  prompts: PromptStore
}

/** 코드펜스/설명 제거 후 <svg>…</svg> 본문만 추출 */
function cleanSvg(raw: string): string {
  const m = raw.match(/<svg[\s\S]*?<\/svg>/i)
  if (!m) throw new Error('생성된 SVG가 유효하지 않습니다')
  return m[0]
}

/** SVG 문자열 → data URI(base64). 렌더러 <img>·exporter addImage 모두 소비 */
function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`
}

/**
 * AI 이미지 생성(P8) — claude -p로 SVG 벡터 일러스트를 생성해 data URI로 반환.
 * 외부 이미지 API 키 불필요(구독 CLI). 통계/개념을 상징적 그래픽으로 표현.
 */
export async function generateImage(
  concept: string,
  deps: ImageDeps,
  opts: { width?: number; height?: number; tokens?: ThemeTokens } = {},
): Promise<{ dataUri: string; svg: string; usage?: { costUsd?: number } }> {
  const width = opts.width ?? 400
  const height = opts.height ?? 300
  const palette = opts.tokens
    ? [opts.tokens.colors.primary, opts.tokens.colors.accent, opts.tokens.colors.secondary].join(', ')
    : '#4f46e5, #14b8a6, #64748b'

  const prompt = deps.prompts.get('image_svg_system', { concept, width, height, palette })
  const { data, usage } = await deps.registry.generateStructured('image', prompt, svgSchema)
  const svg = cleanSvg(data.svg)
  return {
    dataUri: svgToDataUri(svg),
    svg,
    ...(usage?.costUsd !== undefined ? { usage: { costUsd: usage.costUsd } } : {}),
  }
}

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { createDefaultRegistry, PromptStore, generateDeck } from '@im-ppt/core'
import { layoutCatalogForLlm } from '@im-ppt/templates'
import { resolveGenerationConfig } from '@im-ppt/schema'

/**
 * Im PPT Generator MCP 서버(P10) — 생성을 MCP 도구로 노출.
 * Claude Desktop 등 MCP 클라이언트가 프레젠테이션을 생성할 수 있게 한다(신흥 표준).
 * 생성은 claude CLI(구독)로 동작하므로 별도 API 키 불필요.
 */
const registry = createDefaultRegistry()
const prompts = new PromptStore()

const TOOLS = [
  {
    name: 'generate_deck',
    description: '프롬프트로부터 프레젠테이션 덱을 생성한다(아웃라인→슬라이드).',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: '발표 주제/지시' },
        slideCount: { type: 'number', description: '슬라이드 수(기본 8)' },
        language: { type: 'string', description: '생성 언어(기본 ko)' },
        tone: { type: 'string', description: 'formal/casual/professional/academic/playful' },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'list_layouts',
    description: '사용 가능한 슬라이드 레이아웃 목록(각 용도).',
    inputSchema: { type: 'object', properties: {} },
  },
] as const

const server = new Server({ name: 'im-ppt', version: '0.1.0' }, { capabilities: { tools: {} } })

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params
  try {
    if (name === 'list_layouts') {
      return { content: [{ type: 'text', text: JSON.stringify(layoutCatalogForLlm(), null, 2) }] }
    }
    if (name === 'generate_deck') {
      const a = (args ?? {}) as Record<string, unknown>
      if (typeof a.prompt !== 'string' || a.prompt.trim().length === 0) {
        return { isError: true, content: [{ type: 'text', text: 'prompt는 필수입니다' }] }
      }
      const config = resolveGenerationConfig({
        prompt: a.prompt,
        preset: 'quick',
        ...(typeof a.slideCount === 'number' ? { slideCount: a.slideCount } : {}),
        ...(typeof a.language === 'string' ? { language: a.language } : {}),
        ...(typeof a.tone === 'string' ? { tone: a.tone as never } : {}),
      })
      const { deck, costUsd } = await generateDeck(config, { registry, prompts })
      const summary = {
        deckId: deck.id,
        title: deck.title,
        slideCount: deck.slides.length,
        layouts: deck.slides.map((s) => s.layoutType),
        costUsd,
      }
      return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] }
    }
    return { isError: true, content: [{ type: 'text', text: `알 수 없는 도구: ${name}` }] }
  } catch (e) {
    return { isError: true, content: [{ type: 'text', text: (e as Error).message }] }
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
// stderr로 기동 로그(stdout은 MCP 프로토콜 전용)
process.stderr.write('im-ppt MCP 서버 준비(stdio)\n')

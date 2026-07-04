import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { fileURLToPath } from 'node:url'

/** MCP 서버 검증 — 스폰 → tools/list → list_layouts 호출 → (옵션)generate_deck 실 claude */
const mcpDir = fileURLToPath(new URL('..', import.meta.url))

const transport = new StdioClientTransport({
  command: 'node',
  args: ['--import', 'tsx', 'src/index.ts'],
  cwd: mcpDir,
})
const client = new Client({ name: 'verify', version: '0.1.0' }, { capabilities: {} })
await client.connect(transport)

const tools = await client.listTools()
const names = tools.tools.map((t) => t.name)
console.log('tools:', names.join(', '))
if (!names.includes('generate_deck') || !names.includes('list_layouts')) {
  console.error('FAIL: 예상 도구 누락')
  process.exit(1)
}

const layouts = await client.callTool({ name: 'list_layouts', arguments: {} })
const content = (layouts.content as Array<{ type: string; text: string }>)[0]!
const parsed = JSON.parse(content.text) as unknown[]
console.log('list_layouts:', parsed.length, '개 레이아웃')

if (process.env.MCP_GENERATE === '1') {
  console.log('generate_deck 호출(실 claude)…')
  const gen = await client.callTool({
    name: 'generate_deck',
    arguments: { prompt: 'MCP 생성 테스트', slideCount: 3, language: '한국어' },
  })
  const g = (gen.content as Array<{ text: string }>)[0]!
  const summary = JSON.parse(g.text) as { slideCount: number; layouts: string[]; title: string }
  console.log('generate_deck:', summary.slideCount, '슬라이드 |', summary.layouts.join('/'))
}

await client.close()
console.log('PASS')

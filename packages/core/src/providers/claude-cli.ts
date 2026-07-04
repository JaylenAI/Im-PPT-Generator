import { spawn } from 'node:child_process'
import type { GenerateRequest, GenerateResult, GenerateUsage, ProviderAdapter } from './types.js'
import { ProviderError } from './types.js'

/** claude -p --output-format json 응답 봉투(관찰된 형태) */
interface ClaudeCliEnvelope {
  type: string
  subtype?: string
  is_error?: boolean
  api_error_status?: string | null
  result?: string
  structured_output?: unknown
  total_cost_usd?: number
  usage?: { input_tokens?: number; output_tokens?: number }
  modelUsage?: Record<string, { costUSD?: number }>
}

export interface ClaudeCliOptions {
  /** 실행 파일 경로(기본 'claude') — 테스트/환경별 오버라이드 */
  bin?: string
  /** argv 초과 방지용 프롬프트 최대 길이(초과 시 에러) */
  maxPromptChars?: number
}

/**
 * claude CLI(`claude -p`) 프로바이더 — 구독 기반, API 키 불필요.
 * `--json-schema`로 구조화 출력을 강제하고, 응답의 structured_output을 반환한다.
 * 프롬프트는 stdin으로(긴 프롬프트 argv 한계 회피), 스키마는 argv로 전달.
 */
export function createClaudeCliProvider(opts: ClaudeCliOptions = {}): ProviderAdapter {
  const bin = opts.bin ?? 'claude'
  const maxPromptChars = opts.maxPromptChars ?? 500_000

  return {
    kind: 'claude-cli',
    async generateStructured(req: GenerateRequest): Promise<GenerateResult> {
      if (req.prompt.length > maxPromptChars) {
        throw new ProviderError('claude-cli', `프롬프트가 최대 길이를 초과: ${req.prompt.length}자`)
      }
      const args = [
        '-p',
        '--json-schema',
        JSON.stringify(req.schemaJson),
        '--output-format',
        'json',
        '--model',
        req.connection.model,
      ]

      const stdout = await run(bin, args, req.prompt)
      let env: ClaudeCliEnvelope
      try {
        env = JSON.parse(stdout) as ClaudeCliEnvelope
      } catch {
        throw new ProviderError('claude-cli', `응답 JSON 파싱 실패: ${stdout.slice(0, 200)}`)
      }
      if (env.is_error) {
        throw new ProviderError('claude-cli', env.api_error_status ?? env.result ?? '알 수 없는 오류')
      }
      // structured_output(파싱됨) 우선, 없으면 result 문자열을 파싱
      const data =
        env.structured_output !== undefined
          ? env.structured_output
          : env.result !== undefined
            ? safeJson(env.result)
            : undefined
      if (data === undefined) {
        throw new ProviderError('claude-cli', '구조화 출력이 응답에 없습니다')
      }
      const modelKey = env.modelUsage ? Object.keys(env.modelUsage)[0] : undefined
      const usage: GenerateUsage = {}
      if (env.usage?.input_tokens !== undefined) usage.inputTokens = env.usage.input_tokens
      if (env.usage?.output_tokens !== undefined) usage.outputTokens = env.usage.output_tokens
      if (env.total_cost_usd !== undefined) usage.costUsd = env.total_cost_usd
      if (modelKey) usage.model = modelKey
      return { data, usage }
    },
  }
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s)
  } catch {
    throw new ProviderError('claude-cli', `result 필드 JSON 파싱 실패: ${s.slice(0, 200)}`)
  }
}

function run(bin: string, args: string[], stdin: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['pipe', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    child.stdout.on('data', (d) => (out += d.toString()))
    child.stderr.on('data', (d) => (err += d.toString()))
    child.on('error', (e) => reject(new ProviderError('claude-cli', `실행 실패: ${e.message}`)))
    child.on('close', (code) => {
      if (code === 0) resolve(out)
      else reject(new ProviderError('claude-cli', `종료 코드 ${code}: ${err.slice(0, 300)}`))
    })
    child.stdin.write(stdin)
    child.stdin.end()
  })
}

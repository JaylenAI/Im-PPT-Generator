import { z } from 'zod'
import type {
  GenerateUsage,
  ModelConnection,
  ModelTask,
  ProviderAdapter,
  ProviderKind,
} from './types.js'
import { ModelConnectionMissing, ProviderError } from './types.js'
import { createClaudeCliProvider } from './claude-cli.js'
import { sanitizeJsonSchema } from './schema-util.js'

/**
 * 프로바이더 + 모델 연결 레지스트리 (GC-Agent 미러링).
 * - 프로바이더 어댑터: kind별 1개 등록(register로 확장, 분기문 없음)
 * - 모델 연결: 작업 태그로 라우팅, resolve 우선순위 = 명시 id → 작업 할당 → 활성+태그 첫 연결 → 에러
 */
export class ProviderRegistry {
  private providers = new Map<ProviderKind, ProviderAdapter>()
  private connections = new Map<string, ModelConnection>()
  /** 작업별 기본 연결 할당(설정 UI가 편집 — /model-assignments) */
  private assignments = new Map<ModelTask, string>()

  registerProvider(adapter: ProviderAdapter): this {
    this.providers.set(adapter.kind, adapter)
    return this
  }

  registerConnection(conn: ModelConnection): this {
    this.connections.set(conn.id, conn)
    return this
  }

  assign(task: ModelTask, connectionId: string): this {
    if (!this.connections.has(connectionId)) {
      throw new Error(`할당 실패: 존재하지 않는 연결 id ${connectionId}`)
    }
    this.assignments.set(task, connectionId)
    return this
  }

  listConnections(): ModelConnection[] {
    return [...this.connections.values()]
  }

  getAssignments(): Record<string, string> {
    return Object.fromEntries(this.assignments)
  }

  /** resolve 우선순위 준수, 조용한 degrade 금지 */
  resolveConnection(task: ModelTask, explicitId?: string): ModelConnection {
    if (explicitId) {
      const conn = this.connections.get(explicitId)
      if (!conn) throw new ModelConnectionMissing(task, `명시 id '${explicitId}' 없음`)
      return conn
    }
    const assignedId = this.assignments.get(task)
    if (assignedId) {
      const conn = this.connections.get(assignedId)
      if (conn?.isActive) return conn
    }
    const first = [...this.connections.values()].find(
      (c) => c.isActive && c.tags.includes(task),
    )
    if (!first) {
      throw new ModelConnectionMissing(task, `활성 연결 중 태그 '${task}' 보유 없음`)
    }
    return first
  }

  private getProvider(kind: ProviderKind): ProviderAdapter {
    const p = this.providers.get(kind)
    if (!p) throw new ProviderError(kind, '등록되지 않은 프로바이더')
    return p
  }

  /**
   * 구조화 생성 — task로 연결 resolve → 프로바이더 호출 → zod 재검증(이중 안전망).
   * CLI가 --json-schema로 1차 보장, zod가 2차 보장.
   */
  async generateStructured<T>(
    task: ModelTask,
    prompt: string,
    schema: z.ZodType<T>,
    opts: { modelId?: string } = {},
  ): Promise<{ data: T; usage?: GenerateUsage; connection: ModelConnection }> {
    const connection = this.resolveConnection(task, opts.modelId)
    const adapter = this.getProvider(connection.provider)
    const schemaJson = sanitizeJsonSchema(z.toJSONSchema(schema))
    const result = await adapter.generateStructured({ prompt, schemaJson, connection })
    const parsed = schema.safeParse(result.data)
    if (!parsed.success) {
      throw new ProviderError(
        connection.provider,
        `출력이 스키마 검증 실패: ${parsed.error.issues.map((i) => i.path.join('.')).join(', ')}`,
      )
    }
    return { data: parsed.data, ...(result.usage ? { usage: result.usage } : {}), connection }
  }
}

/** 기본 레지스트리 — claude-cli 프로바이더 + sonnet/opus 연결(구독 기반, 키 불필요) */
export function createDefaultRegistry(): ProviderRegistry {
  const registry = new ProviderRegistry()
  registry.registerProvider(createClaudeCliProvider())

  const allTasks: ModelTask[] = ['outline', 'slide', 'edit', 'research', 'vision', 'image']
  registry.registerConnection({
    id: 'claude-cli-sonnet',
    name: 'Claude CLI · Sonnet',
    provider: 'claude-cli',
    model: 'sonnet',
    tags: allTasks,
    params: { adminOnly: false },
    isActive: true,
  })
  registry.registerConnection({
    id: 'claude-cli-opus',
    name: 'Claude CLI · Opus',
    provider: 'claude-cli',
    model: 'opus',
    tags: allTasks,
    params: { adminOnly: false },
    isActive: true,
  })
  return registry
}

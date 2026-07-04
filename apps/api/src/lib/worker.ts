import type { GenerationEvent } from '@im-ppt/schema'
import { generateDeckStreaming, type ResearchInput } from '@im-ppt/core'
import type { JobStore } from '@im-ppt/db'
import type { AppDeps } from '../deps.js'
import { runResearchForConfig } from './research-runner.js'
import { applyBranding } from './brand.js'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface Worker {
  /** 큐에서 잡 하나를 처리(있으면 true). 라우트가 enqueue 직후 kick으로도 호출 */
  processOne(): Promise<boolean>
  /** 백그라운드 폴 루프 시작 — 재시도/백오프/크래시 복구 담당 */
  start(): void
  stop(): Promise<void>
}

export interface WorkerOptions {
  pollIntervalMs?: number
  onError?: (err: Error) => void
}

/**
 * 생성 워커 — 잡을 claim해 generateDeckStreaming을 돌리고 이벤트를 잡 로그에 영속.
 * claim이 원자적이라 kick과 백그라운드 루프가 겹쳐도 한 잡은 한 번만 처리된다.
 */
export function createWorker(deps: AppDeps, opts: WorkerOptions = {}): Worker {
  const pollIntervalMs = opts.pollIntervalMs ?? 500
  let running = false
  let loopPromise: Promise<void> | null = null

  async function processOne(): Promise<boolean> {
    const job = await deps.jobs.claim()
    if (!job) return false
    const { id, deckId, config, userSources } = job
    // 재시도라면 이전 시도의 부분 이벤트를 지워 재생이 최신 시도만 반영
    await deps.jobs.resetEvents(id)
    const append = (event: GenerationEvent) => deps.jobs.appendEvent(id, event)
    await append({ type: 'job_started', jobId: id, deckId })
    try {
      // 리서치 단계 — researchMode != off면 소스 수집 + 팩트 추출(할루시네이션 제로)
      let research: ResearchInput | undefined
      if (config.researchMode !== 'off') {
        await append({ type: 'research_started', query: config.prompt })
        research = await runResearchForConfig(deps, config, userSources, (s) =>
          append({ type: 'source_found', source: s }),
        )
      }
      const generated = await generateDeckStreaming(
        config,
        { registry: deps.registry, prompts: deps.prompts },
        append,
        { deckId, ...(research ? { research } : {}) },
      )
      const deck = applyBranding(deps, generated, config.templateId)
      await deps.decks.put(deck)
      await append({ type: 'deck_saved', deckId: deck.id, deck })
      await deps.jobs.complete(id)
    } catch (e) {
      const message = (e as Error).message
      const updated = await deps.jobs.fail(id, message)
      // 최종 실패(재시도 소진)만 스트림에 남긴다 — 재큐면 다음 시도가 로그를 다시 쓴다
      if (updated?.status === 'error') await append({ type: 'job_error', message })
    }
    return true
  }

  async function loop(): Promise<void> {
    while (running) {
      let did = false
      try {
        did = await processOne()
      } catch (e) {
        opts.onError?.(e as Error)
      }
      if (!did) await sleep(pollIntervalMs)
    }
  }

  return {
    processOne,
    start() {
      if (running) return
      running = true
      loopPromise = loop()
    },
    async stop() {
      running = false
      await loopPromise?.catch(() => {})
      loopPromise = null
    },
  }
}

/**
 * 잡 이벤트 재생 tail — DB 잡 로그를 커서로 폴링해 흘린다.
 * 재접속: 커서 0부터 전체 재생. 재시도로 로그가 리셋되면 커서를 되감아 다시 재생.
 * 워커와 다른(또는 같은) 프로세스여도 DB가 SSOT라 견고.
 */
export async function tailJob(
  store: JobStore,
  jobId: string,
  send: (event: GenerationEvent) => void | Promise<void>,
  opts: { pollMs?: number; timeoutMs?: number; isAborted?: () => boolean } = {},
): Promise<void> {
  const pollMs = opts.pollMs ?? 250
  const deadline = Date.now() + (opts.timeoutMs ?? 10 * 60 * 1000)
  let sent = 0
  for (;;) {
    if (opts.isAborted?.()) return
    const job = await store.get(jobId)
    if (!job) {
      await send({ type: 'job_error', message: '잡을 찾을 수 없습니다', code: 'NOT_FOUND' })
      return
    }
    if (job.events.length < sent) sent = 0 // 로그 리셋(재시도) → 되감아 재생
    for (let i = sent; i < job.events.length; i++) {
      const event = job.events[i]
      if (event) await send(event)
    }
    sent = job.events.length
    if (job.status === 'done' || job.status === 'error') return
    if (Date.now() > deadline) return
    await sleep(pollMs)
  }
}

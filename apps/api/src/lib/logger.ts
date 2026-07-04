type Level = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 }

/** 구조화 로거 — console 직접 호출 대신 사용, PII/시크릿은 호출부에서 마스킹 책임 */
export function createLogger(minLevel: Level = 'info') {
  const emit = (level: Level, message: string, meta?: Record<string, unknown>) => {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return
    const line = JSON.stringify({ level, message, ...meta, ts: new Date().toISOString() })
    if (level === 'error') process.stderr.write(`${line}\n`)
    else process.stdout.write(`${line}\n`)
  }

  return {
    debug: (message: string, meta?: Record<string, unknown>) => emit('debug', message, meta),
    info: (message: string, meta?: Record<string, unknown>) => emit('info', message, meta),
    warn: (message: string, meta?: Record<string, unknown>) => emit('warn', message, meta),
    error: (message: string, meta?: Record<string, unknown>) => emit('error', message, meta),
  }
}

export type Logger = ReturnType<typeof createLogger>

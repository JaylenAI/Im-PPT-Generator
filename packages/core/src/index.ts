// Providers
export * from './providers/types.js'
export * from './providers/params.js'
export { createClaudeCliProvider, type ClaudeCliOptions } from './providers/claude-cli.js'
export { ProviderRegistry, createDefaultRegistry } from './providers/registry.js'

// Prompts (prompts-as-data)
export { PROMPT_CATALOG, type PromptDef, type PromptKey } from './prompts/catalog.js'
export { PromptStore, safeFormat } from './prompts/loader.js'

// Config (settings/masking)
export * from './config/masking.js'

// Pipeline
export { generateOutline, type OutlineDeps } from './pipeline/outline.js'
export { generateSlide, type SlideDeps } from './pipeline/slide.js'
export { generateDeck } from './pipeline/deck.js'

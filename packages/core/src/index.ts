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
export { generatePlans, type PlanDeps } from './pipeline/plan.js'
export { generateVariants } from './pipeline/variants.js'
export { generateDeck, generateDeckStreaming, type ResearchInput } from './pipeline/deck.js'
export { editSlide, replaceSlide } from './pipeline/edit.js'
export { translateDeck, rewriteDeck, type TranslateDeps } from './pipeline/translate.js'

// Analysis
export {
  checkAccessibility,
  contrastRatio,
  type A11yReport,
  type A11yIssue,
} from './analysis/accessibility.js'

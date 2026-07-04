export { runResearch } from './pipeline.js'
export { extractFacts, type SourceDoc } from './extract-facts.js'
export { buildCitations, citationIdsForFacts, type BuiltCitations } from './citations.js'
export { fetchUrlText, htmlToText } from './fetch-url.js'
export { createTavilyAdapter } from './adapters/tavily.js'
export { createSerperAdapter } from './adapters/serper.js'
export type {
  StructuredLlm,
  SearchAdapter,
  SearchResult,
  UserSourceInput,
  ResearchInput,
  ResearchDeps,
  ResearchResult,
} from './types.js'

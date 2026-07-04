import { writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveGenerationConfig } from '@im-ppt/schema'
import { getTheme } from '@im-ppt/templates'
import { createDefaultRegistry, PromptStore, generateDeck } from '@im-ppt/core'
import { exportDeckToPptx } from '../src/index.js'

/**
 * 풀 파이프라인 E2E — 프롬프트 → (claude -p) 덱 생성 → PPTX 파일 저장.
 * RUN_LLM_INTEGRATION=1 로 실행. 산출물을 바탕화면에 저장해 실제 PowerPoint에서 열어 확인.
 */
const RUN = process.env.RUN_LLM_INTEGRATION === '1'

describe.skipIf(!RUN)('E2E: 프롬프트 → 덱 → PPTX 파일', () => {
  it('실 덱을 생성해 PPTX로 저장한다', async () => {
    const config = resolveGenerationConfig({
      prompt: 'AI 프레젠테이션 자동화 서비스 투자 제안',
      preset: 'quick',
      slideCount: 6,
      language: '한국어',
    })
    const { deck, costUsd } = await generateDeck(config, {
      registry: createDefaultRegistry(),
      prompts: new PromptStore(),
    })
    const tokens = getTheme(deck.themeId).tokens
    const buf = await exportDeckToPptx(deck, tokens, { includeNotes: true })

    const out = join(homedir(), 'Desktop', '데모_Im-PPT-Generator.pptx')
    await writeFile(out, buf)
    console.log(`저장됨: ${out} (${deck.slides.length}장, ${(buf.length / 1024).toFixed(0)}KB, $${costUsd.toFixed(3)})`)

    expect(buf[0]).toBe(0x50)
    expect(deck.slides.length).toBeGreaterThanOrEqual(4)
  }, 240_000)
})

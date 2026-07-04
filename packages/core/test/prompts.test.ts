import { describe, expect, it } from 'vitest'
import { PromptStore, safeFormat, PROMPT_CATALOG } from '../src/index.js'

describe('safeFormat', () => {
  it('변수를 치환한다', () => {
    expect(safeFormat('안녕 {name}, {n}개', { name: '홍', n: 3 })).toBe('안녕 홍, 3개')
  })
  it('없는 placeholder는 원문 유지(KeyError 방지)', () => {
    expect(safeFormat('{a}와 {missing}', { a: 'X' })).toBe('X와 {missing}')
  })
})

describe('PromptStore', () => {
  it('오버라이드 없으면 카탈로그 기본값', () => {
    const store = new PromptStore()
    const out = store.get('outline_system', { topic: 'AI', slideCount: 10, tone: 'formal', audience: '임원', language: '한국어', layoutCatalog: '-' })
    expect(out).toContain('AI')
    expect(out).toContain('전문 프레젠테이션 기획자')
  })

  it('오버라이드가 기본값을 대체', () => {
    const store = new PromptStore()
    store.setOverride('outline_system', '커스텀: {topic}')
    expect(store.get('outline_system', { topic: '전기차' })).toBe('커스텀: 전기차')
  })

  it('빈 문자열 오버라이드는 기본값 복귀(GC-Agent PATCH 동작)', () => {
    const store = new PromptStore()
    store.setOverride('outline_system', '커스텀')
    store.setOverride('outline_system', '  ')
    expect(store.list().find((p) => p.key === 'outline_system')?.isOverridden).toBe(false)
  })

  it('list()가 설정 UI용 메타를 반환', () => {
    const store = new PromptStore()
    store.setOverride('edit_system', '내 편집 프롬프트')
    const meta = store.list()
    expect(meta.length).toBe(Object.keys(PROMPT_CATALOG).length)
    const edit = meta.find((p) => p.key === 'edit_system')
    expect(edit?.isOverridden).toBe(true)
    expect(edit?.currentContent).toBe('내 편집 프롬프트')
    expect(edit?.defaultContent).not.toBe('내 편집 프롬프트')
  })
})

import { describe, expect, it } from 'vitest'
import { templateMetaSchema, customTemplateSchema } from '../src/index.js'

const validTokens = {
  colors: {
    primary: '#4F46E5',
    secondary: '#64748B',
    accent: '#06B6D4',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
  },
  fonts: { heading: 'Arial', body: 'Arial' },
  fontSizes: { display: 44, title: 30, subtitle: 20, body: 15, caption: 11 },
}

describe('templateMetaSchema', () => {
  it('source 미지정 시 builtin 기본값', () => {
    const t = templateMetaSchema.parse({
      id: 't1',
      name: 'Corporate',
      category: 'business',
      themeId: 'stitch-indigo',
      aspectRatios: ['16:9'],
      layoutTypes: ['title', 'bullets'],
    })
    expect(t.source).toBe('builtin')
  })
})

describe('customTemplateSchema (사용자 저장/추출 템플릿)', () => {
  const base = {
    id: 'user-tpl-1',
    name: '내 회사 양식',
    category: 'business' as const,
    themeId: 'user-tpl-1',
    aspectRatios: ['16:9'] as const,
    layoutTypes: ['title', 'bullets'],
    source: 'user' as const,
    workspaceId: 'default',
    themeTokens: validTokens,
  }

  it('테마 토큰을 인라인 소유해야 파싱된다 (DB가 테마 소유)', () => {
    expect(customTemplateSchema.safeParse(base).success).toBe(true)
  })

  it('workspaceId 없으면 거부 (사용자 템플릿은 소유자 필수)', () => {
    const { workspaceId, ...noWs } = base
    expect(customTemplateSchema.safeParse(noWs).success).toBe(false)
  })

  it('source=builtin은 커스텀 템플릿이 될 수 없다', () => {
    expect(customTemplateSchema.safeParse({ ...base, source: 'builtin' }).success).toBe(false)
  })

  it('imported_pptx는 원본 파일 참조를 담을 수 있다', () => {
    const imported = { ...base, source: 'imported_pptx' as const, sourceFileRef: '/data/uploads/x.pptx' }
    expect(customTemplateSchema.safeParse(imported).success).toBe(true)
  })
})

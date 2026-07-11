import { describe, expect, it } from 'vitest'
import { CANVAS_SIZES, slideElementSchema } from '@im-ppt/schema'
import { getLayout, listLayouts, layoutCatalogForLlm } from '../src/index.js'

const ctx = { canvas: CANVAS_SIZES['16:9'] }

/** 레이아웃별 유효 콘텐츠 fixture — 새 레이아웃 추가 시 여기에 반드시 추가 */
const FIXTURES: Record<string, unknown> = {
  title: { title: 'AI 시장 분석 2026', subtitle: '시장 동향과 대응 전략', presenter: '한승헌', date: '2026-07-03' },
  agenda: { title: '목차', items: ['시장 현황', '경쟁 구도', '전략 제안', '로드맵'] },
  bullets: { title: '핵심 요약', bullets: ['시장 규모 연 34% 성장', '상위 3사 점유율 62%', '규제 리스크 확대'], note: '출처: 시장 보고서' },
  'two-col': {
    title: 'As-Is vs To-Be',
    left: { heading: '현재', bullets: ['수작업 제작', '출처 불명'] },
    right: { heading: '개선 후', bullets: ['AI 자동화', '전 수치 출처 추적'] },
  },
  stat: { title: '성과 지표', stats: [{ value: '87%', label: '검색 정확도' }, { value: '2.3초', label: '평균 응답' }, { value: '42명', label: 'DAU' }] },
  quote: { quote: '가장 좋은 미래 예측 방법은 미래를 직접 만드는 것이다', attribution: 'Alan Kay' },
  chart: {
    title: '분기별 매출',
    chartType: 'bar',
    data: { labels: ['Q1', 'Q2', 'Q3'], series: [{ name: '매출', values: [10, 24, 31] }] },
    insight: 'Q3 급성장은 신규 채널 효과',
  },
  closing: { headline: '감사합니다', message: '질문을 환영합니다' },
  references: { title: '출처', items: ['시장 보고서 2026 — https://example.com/report', '내부 분석 메모'] },
  process: {
    title: '도입 4단계',
    steps: [
      { label: '진단', detail: '현황 파악' },
      { label: '설계', detail: '로드맵 수립' },
      { label: '실행', detail: '단계적 배포' },
      { label: '정착', detail: '성과 측정' },
    ],
  },
  timeline: { title: '연혁', milestones: [{ date: '2023', label: '창업' }, { date: '2024', label: '성장', detail: '시리즈A' }, { date: '2025', label: '확장' }] },
  comparison: { title: '비교', left: { heading: '현재', items: ['느림', '수동'] }, right: { heading: '개선', items: ['빠름', '자동'] } },
  'kpi-grid': { title: '실적', kpis: [{ value: '92%', label: '만족도', delta: '+5%' }, { value: '3.4배', label: '성장' }, { value: '#1', label: '점유율' }] },
  cards: { title: '특징', cards: [{ heading: '빠름', body: '즉시 생성' }, { heading: '정확', body: '출처 검증' }, { heading: '편함', body: '원클릭' }] },
  bignum: { value: '268곳', caption: '전국 소멸위험 지역', context: 'AI가 청년과 매칭' },
  roadmap: { title: '로드맵', phases: [{ name: '진단', items: ['현황', '목표'] }, { name: '실행', items: ['개발', '배포'] }, { name: '확산', items: ['운영'] }] },
  section: { index: '01', label: '시장 분석', title: '왜 지금인가', subtitle: 'AI 프레젠테이션 시장의 변곡점' },
  statement: { kicker: '핵심 명제', statement: '생성은 해결됐다. 이제 승부는 콘텐츠 품질과 편집 충실도다.', source: '2026 경쟁 감사' },
  'feature-quote': { quote: '가장 좋은 미래 예측 방법은 미래를 직접 만드는 것이다', attribution: 'Alan Kay', role: 'Xerox PARC' },
  'split-feature': { label: '제품 원칙', title: 'AI는 채우고, 레이아웃이 배치한다', lead: '오버플로가 구조적으로 불가능한 설계', points: ['레이아웃은 코드', '테마는 토큰', '검증된 콘텐츠만 좌표로'] },
  'hero-image': { eyebrow: '2026 리포트', title: 'AI 프레젠테이션의 다음 표준', subtitle: '리서치·서사·데이터 스토리텔링을 하나로' },
  'feature-grid': { title: '세 가지 차별점', features: [{ heading: '액션 타이틀', body: '제목이 곧 결론 문장' }, { heading: '데이터 스토리텔링', body: '핵심 수치만 강조' }, { heading: 'Deck Doctor', body: '진단과 자동 수정' }] },
  // R2 PPT 20선 재현 — 신규 레이아웃 8종
  'editorial-cover': { kicker: 'PORTFOLIO 2026', title: '한승헌 · 프로덕트 디자이너', subtitle: '데이터로 설득하는 프레젠테이션을 설계합니다', meta: ['서울', 'developer3@gcsc.co.kr', '10년 경력'] },
  'toc-index': { title: '목차', items: [{ label: '시장 현황', note: '규모와 성장률' }, { label: '경쟁 구도', note: '상위 3사 분석' }, { label: '전략 제안' }, { label: '실행 로드맵', note: '분기별 마일스톤' }, { label: '기대 효과' }, { label: '리스크 관리' }] },
  'profile-split': { name: '한승헌', role: '시니어 프로덕트 디자이너', bio: '10년간 B2B SaaS 제품의 사용자 경험을 설계해 왔습니다. 데이터 기반 의사결정과 빠른 프로토타이핑을 지향합니다.', details: [{ label: 'Email', value: 'dev3@gcsc.co.kr' }, { label: 'Phone', value: '010-1234-5678' }, { label: 'Location', value: '서울, 대한민국' }, { label: 'Portfolio', value: 'behance.net/hansh' }, { label: 'Experience', value: '10년+' }] },
  'metric-bars': { title: '핵심 역량', bars: [{ label: 'UX 설계', value: 92, caption: '리서치·정보구조·플로우' }, { label: '데이터 시각화', value: 85 }, { label: '프로토타이핑', value: 78, caption: 'Figma·Framer' }, { label: '프론트엔드 협업', value: 70 }, { label: '사용자 리서치', value: 88 }] },
  'steps-circles': { title: '도입 프로세스', steps: [{ title: '진단', body: '현황과 목표를 파악합니다' }, { title: '설계', body: '로드맵과 지표를 수립합니다' }, { title: '실행', body: '단계적으로 배포합니다' }, { title: '정착', body: '성과를 측정하고 개선합니다' }] },
  'photo-strip': { title: '주요 작업물', items: [{ caption: 'ERP 대시보드 리디자인', tag: 'UX' }, { caption: '모바일 온보딩 개선', tag: 'Mobile' }, { caption: '디자인 시스템 구축', tag: 'System' }, { caption: '데이터 시각화 툴', tag: 'Data' }] },
  'team-grid': { title: '팀 소개', members: [{ name: '김대표', role: 'CEO', note: '전략과 비전' }, { name: '이기술', role: 'CTO', note: '아키텍처 총괄' }, { name: '박디자', role: 'Design Lead', note: '제품 경험 설계' }, { name: '최성장', role: 'Growth', note: '데이터 기반 성장' }] },
  'dashboard-cards': { title: '분기 실적 요약', cards: [{ value: '₩4.2억', label: '분기 매출', delta: '+18% QoQ', trend: 'up' }, { value: '1,240', label: '신규 가입자', delta: '+320', trend: 'up' }, { value: '3.4%', label: '이탈률', delta: '-0.8%p', trend: 'down' }, { value: '92점', label: 'NPS', delta: '유지', trend: 'flat' }] },
}

describe('레이아웃 레지스트리', () => {
  it('레이아웃 30종이 등록되어 있다(references는 hidden)', () => {
    expect(listLayouts().map((l) => l.key).sort()).toEqual(
      ['agenda', 'bignum', 'bullets', 'cards', 'chart', 'closing', 'comparison', 'dashboard-cards', 'editorial-cover', 'feature-grid', 'feature-quote', 'hero-image', 'kpi-grid', 'metric-bars', 'photo-strip', 'process', 'profile-split', 'quote', 'references', 'roadmap', 'section', 'split-feature', 'stat', 'statement', 'steps-circles', 'team-grid', 'timeline', 'title', 'toc-index', 'two-col'],
    )
  })

  it('hidden 레이아웃(references)은 LLM 카탈로그에서 제외', () => {
    expect(layoutCatalogForLlm().map((l) => l.key)).not.toContain('references')
    expect(listLayouts().some((l) => l.key === 'references')).toBe(true)
  })

  it('미등록 layoutType은 사용 가능 목록과 함께 에러', () => {
    expect(() => getLayout('hero-banner')).toThrow(/등록되지 않은 layoutType/)
  })

  it('LLM 카탈로그는 key+description을 제공한다', () => {
    for (const item of layoutCatalogForLlm()) {
      expect(item.key.length).toBeGreaterThan(0)
      expect(item.description.length).toBeGreaterThan(10)
    }
  })
})

describe('레이아웃 build — 전 레이아웃 공통 계약', () => {
  for (const layout of listLayouts()) {
    describe(layout.key, () => {
      it('fixture가 존재한다 (새 레이아웃은 테스트 fixture 필수)', () => {
        expect(FIXTURES[layout.key]).toBeDefined()
      })

      it('스키마를 통과하는 요소를 생성한다', () => {
        const { elements } = layout.build(FIXTURES[layout.key], ctx)
        expect(elements.length).toBeGreaterThan(0)
        for (const el of elements) {
          const parsed = slideElementSchema.safeParse(el)
          expect(parsed.success, `${layout.key}/${el.id}: ${JSON.stringify(parsed.success ? '' : parsed.error.issues)}`).toBe(true)
        }
      })

      it('모든 화면비(16:9/4:3/9:16)에서 요소가 캔버스 안(오버플로 금지)', () => {
        for (const size of Object.values(CANVAS_SIZES)) {
          const { elements } = layout.build(FIXTURES[layout.key], { canvas: size })
          for (const el of elements) {
            expect(el.frame.x, `${layout.key}/${el.id} x @${size.width}×${size.height}`).toBeGreaterThanOrEqual(-0.5)
            expect(el.frame.y, `${layout.key}/${el.id} y`).toBeGreaterThanOrEqual(-0.5)
            expect(el.frame.x + el.frame.w, `${layout.key}/${el.id} 우측 @${size.width}`).toBeLessThanOrEqual(size.width + 0.5)
            expect(el.frame.y + el.frame.h, `${layout.key}/${el.id} 하단 @${size.height}`).toBeLessThanOrEqual(size.height + 0.5)
          }
        }
      })

      it('요소 id가 슬라이드 내에서 유일하다', () => {
        const { elements } = layout.build(FIXTURES[layout.key], ctx)
        const ids = elements.map((e) => e.id)
        expect(new Set(ids).size).toBe(ids.length)
      })

      it('검증 안 된 콘텐츠는 build에 도달하지 못한다', () => {
        expect(() => layout.build({ 뭔가: '잘못된' }, ctx)).toThrow()
      })
    })
  }
})

describe('개별 레이아웃 동작', () => {
  it('stat: 카드 수만큼 값/라벨을 생성하고 겹치지 않는다', () => {
    const { elements } = getLayout('stat').build(FIXTURES['stat'], ctx)
    const cards = elements.filter((e) => e.id.startsWith('stat-card-'))
    expect(cards).toHaveLength(3)
    const [a, b] = cards
    if (a && b) expect(a.frame.x + a.frame.w).toBeLessThanOrEqual(b.frame.x)
  })

  it('chart: insight 없으면 차트가 전폭을 쓴다', () => {
    const { elements } = getLayout('chart').build(
      { title: 'T', chartType: 'line', data: { labels: ['a'], series: [{ name: 's', values: [1] }] } },
      ctx,
    )
    const chart = elements.find((e) => e.type === 'chart')
    expect(chart?.frame.w).toBe(1120)
  })

  it('title: 스키마 한도(80자) 초과 제목은 build 전에 거부된다', () => {
    expect(() => getLayout('title').build({ title: '가'.repeat(81) }, ctx)).toThrow()
  })
})

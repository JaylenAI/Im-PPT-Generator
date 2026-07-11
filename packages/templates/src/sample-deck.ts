import type { Deck, Slide, TemplateMeta, ThemeTokens } from '@im-ppt/schema'
import { CANVAS_SIZES } from '@im-ppt/schema'
import { TEMPLATES, getLayout, getTheme, hasTheme } from './registry.js'
import { PPT20_DARK_MASTHEAD } from './themes/ppt20.js'

/**
 * 템플릿 미리보기용 샘플 덱 — LLM 없이 결정론적 플레이스홀더로 그 템플릿의 디자인을 보여준다.
 * 갤러리 썸네일/미리보기 모달이 이 덱을 우리 렌더러로 그대로 렌더(Canva식 실제 미리보기).
 *
 * layoutOrder(설계된 서사 시퀀스)가 있으면 그 흐름대로 렌더 → 갤러리 썸네일(슬라이드 0)이
 * 그 템플릿의 시그니처 표지(예: 이력서=editorial-cover)를 보여줘 "그대로" 인상이 살아난다.
 * 없으면 범용 5슬라이드 세트로 폴백.
 */

/** 레이아웃별 결정론적 샘플 콘텐츠 — 각 레이아웃 contentSchema를 통과하는 대표 예시(미리보기 전용) */
const SAMPLE_CONTENT: Record<string, unknown> = {
  agenda: { title: '목차', items: ['시장 현황', '경쟁 구도', '전략 제안', '실행 로드맵'] },
  bullets: { title: '핵심 요약', bullets: ['시장 규모 연 34% 성장', '상위 3사 점유율 62%', '규제 리스크 확대'], note: '출처: 시장 보고서' },
  'two-col': { title: 'As-Is vs To-Be', left: { heading: '현재', bullets: ['수작업 제작', '출처 불명'] }, right: { heading: '개선 후', bullets: ['AI 자동화', '전 수치 출처 추적'] } },
  stat: { title: '성과 지표', stats: [{ value: '92%', label: '고객 만족도' }, { value: '3.4배', label: '전년 대비 성장' }, { value: '#1', label: '시장 점유율' }] },
  quote: { quote: '가장 좋은 미래 예측 방법은 미래를 직접 만드는 것이다', attribution: 'Alan Kay' },
  chart: { title: '분기별 성장 추이', chartType: 'bar', data: { labels: ['Q1', 'Q2', 'Q3', 'Q4'], series: [{ name: '매출', values: [40, 58, 72, 110] }] }, insight: '4분기 들어 성장이 가속됐다', highlightIndex: 3 },
  process: { title: '도입 4단계', steps: [{ label: '진단', detail: '현황 파악' }, { label: '설계', detail: '로드맵 수립' }, { label: '실행', detail: '단계적 배포' }, { label: '정착', detail: '성과 측정' }] },
  timeline: { title: '연혁', milestones: [{ date: '2023', label: '창업' }, { date: '2024', label: '성장', detail: '시리즈A' }, { date: '2025', label: '확장' }] },
  comparison: { title: '비교', left: { heading: '현재', items: ['느림', '수동'] }, right: { heading: '개선', items: ['빠름', '자동'] } },
  'kpi-grid': { title: '주요 성과 지표', kpis: [{ value: '92%', label: '고객 만족도', delta: '+8%p' }, { value: '3.4배', label: '전년 대비 성장' }, { value: '#1', label: '시장 점유율' }] },
  cards: { title: '핵심 강점', cards: [{ heading: '빠른 생성', body: '주제만 입력하면 AI가 완성된 덱을 만듭니다' }, { heading: '근거 기반', body: '모든 수치는 출처로 역추적됩니다' }, { heading: '바로 편집', body: '진짜 편집 가능한 PPTX로 내보냅니다' }] },
  bignum: { value: '268곳', caption: '전국 소멸위험 지역', context: 'AI가 청년과 매칭' },
  roadmap: { title: '로드맵', phases: [{ name: '진단', items: ['현황', '목표'] }, { name: '실행', items: ['개발', '배포'] }, { name: '확산', items: ['운영'] }] },
  section: { index: '01', label: '시장 분석', title: '왜 지금인가', subtitle: 'AI 프레젠테이션 시장의 변곡점' },
  statement: { kicker: '핵심 명제', statement: '생성은 해결됐다. 이제 승부는 콘텐츠 품질과 편집 충실도다.', source: '2026 경쟁 감사' },
  'feature-quote': { quote: '가장 좋은 미래 예측 방법은 미래를 직접 만드는 것이다', attribution: 'Alan Kay', role: 'Xerox PARC' },
  'split-feature': { label: '제품 원칙', title: 'AI는 채우고, 레이아웃이 배치한다', lead: '오버플로가 구조적으로 불가능한 설계', points: ['레이아웃은 코드', '테마는 토큰', '검증된 콘텐츠만 좌표로'] },
  'hero-image': { eyebrow: '2026 리포트', title: 'AI 프레젠테이션의 다음 표준', subtitle: '리서치·서사·데이터 스토리텔링을 하나로' },
  'feature-grid': { title: '세 가지 차별점', features: [{ heading: '액션 타이틀', body: '제목이 곧 결론 문장' }, { heading: '데이터 스토리텔링', body: '핵심 수치만 강조' }, { heading: 'Deck Doctor', body: '진단과 자동 수정' }] },
  // R2 신규 레이아웃 — 에디토리얼/이력서/대시보드
  'editorial-cover': { kicker: 'PORTFOLIO 2026', title: '한승헌 · 프로덕트 디자이너', subtitle: '데이터로 설득하는 프레젠테이션을 설계합니다', meta: ['서울', 'hello@example.com', '경력 10년'] },
  'hero-cover': { kicker: 'COMPANY PROFILE', title: '히어로 표지', subtitle: '브랜드 컬러로 채운 강렬한 첫인상' },
  'toc-index': { title: '목차', items: [{ label: '소개', note: '경력과 지향점' }, { label: '핵심 역량', note: '숙련도' }, { label: '프로세스' }, { label: '주요 작업물', note: '포트폴리오' }, { label: '팀' }, { label: '연락처' }] },
  'profile-split': { name: '한승헌', role: '시니어 프로덕트 디자이너', bio: '10년간 B2B SaaS 제품의 사용자 경험을 설계해 왔습니다. 데이터 기반 의사결정과 빠른 프로토타이핑을 지향합니다.', details: [{ label: 'Email', value: 'hello@example.com' }, { label: 'Phone', value: '010-1234-5678' }, { label: 'Location', value: '서울, 대한민국' }, { label: 'Portfolio', value: 'behance.net/hansh' }] },
  'metric-bars': { title: '핵심 역량', bars: [{ label: 'UX 설계', value: 92, caption: '리서치·정보구조·플로우' }, { label: '데이터 시각화', value: 85 }, { label: '프로토타이핑', value: 78 }, { label: '사용자 리서치', value: 88 }] },
  'steps-circles': { title: '작업 프로세스', steps: [{ title: '진단', body: '현황과 목표를 파악합니다' }, { title: '설계', body: '로드맵과 지표를 수립합니다' }, { title: '실행', body: '단계적으로 배포합니다' }, { title: '정착', body: '성과를 측정하고 개선합니다' }] },
  'photo-strip': { title: '주요 작업물', items: [{ caption: 'ERP 대시보드 리디자인', tag: 'UX' }, { caption: '모바일 온보딩 개선', tag: 'Mobile' }, { caption: '디자인 시스템 구축', tag: 'System' }] },
  'team-grid': { title: '팀 소개', members: [{ name: '김대표', role: 'CEO', note: '전략과 비전' }, { name: '이기술', role: 'CTO', note: '아키텍처 총괄' }, { name: '박디자', role: 'Design Lead', note: '제품 경험 설계' }] },
  'dashboard-cards': { title: '분기 실적 요약', cards: [{ value: '₩4.2억', label: '분기 매출', delta: '+18% QoQ', trend: 'up' }, { value: '1,240', label: '신규 가입자', delta: '+320', trend: 'up' }, { value: '3.4%', label: '이탈률', delta: '-0.8%p', trend: 'down' }] },
  // 시그니처 재현 — 매거진 헤드라인(거대 하단 헤딩+원형 배지+사진+대형 숫자)
  'editorial-headline': { heading: 'ABOUT', badge: 'A', number: '01', label: 'OVERVIEW · 2024', photo: true, body: '10년간 제품 경험을 설계해 온 디자이너입니다. 데이터 기반 의사결정과 빠른 프로토타이핑으로 명확한 이야기를 만듭니다.' },
}

/** 미리보기 폴백(layoutOrder 없는 템플릿) — 범용 5슬라이드 */
const FALLBACK_SEQ = ['title', 'kpi-grid', 'cards', 'chart', 'closing']

export function buildSampleDeck(template: TemplateMeta | string, themeOverride?: ThemeTokens): Deck {
  const tpl = typeof template === 'string' ? TEMPLATES.find((t) => t.id === template) ?? TEMPLATES[0]! : template
  const canvas = CANVAS_SIZES['16:9']
  // 디자인 시스템 스타일 — 커스텀은 인라인 토큰, builtin은 레지스트리 테마에서 해석
  const style = themeOverride?.style ?? (hasTheme(tpl.themeId) ? getTheme(tpl.themeId).tokens.style : undefined)

  const contentFor = (layoutKey: string): unknown => {
    // 표지 슬롯은 템플릿 정체성(이름)을 반영, 그 외는 대표 샘플
    if (layoutKey === 'title') return { title: tpl.name, subtitle: '샘플 미리보기 — 이 템플릿의 디자인' }
    if (layoutKey === 'hero-cover') return { kicker: 'COMPANY PROFILE', title: tpl.name, subtitle: '브랜드 컬러로 채운 강렬한 첫인상' }
    if (layoutKey === 'editorial-cover') return { kicker: 'PROFILE', title: tpl.name, subtitle: '샘플 미리보기 — 이 템플릿의 디자인', meta: ['Seoul, Korea', 'hello@example.com', '2025'] }
    if (layoutKey === 'masthead-cover') return { title: tpl.name, tag: 'PRESENTATION', photo: true, meta: ['NAME HERE', '2024 — 2025', 'PORTFOLIO'], ...(PPT20_DARK_MASTHEAD.has(tpl.themeId) ? { dark: true } : {}) }
    if (layoutKey === 'ring-cover') return { kicker: 'PRESENTATION', title: tpl.name, subtitle: 'Creative presentation template' }
    if (layoutKey === 'report-cover') {
      // 이름을 첫 단어(잉크)+나머지(액센트)로 나눠 투톤 마스트헤드 재현
      const [head, ...rest] = tpl.name.split(' ')
      return { kicker: 'PROPOSAL', title: head ?? tpl.name, ...(rest.length > 0 ? { accent: rest.join(' ') } : {}), tagline: '샘플 미리보기 — 이 템플릿의 디자인', year: '2025', meta: ['Company Name', 'Seoul, Korea', 'hello@example.com'] }
    }
    if (layoutKey === 'closing') return { headline: '함께 시작하세요', message: tpl.name }
    return SAMPLE_CONTENT[layoutKey]
  }

  const mk = (layoutKey: string): Slide | null => {
    const content = contentFor(layoutKey)
    if (content === undefined) return null // 샘플 콘텐츠 없는 레이아웃은 미리보기에서 생략
    const { background, elements } = getLayout(layoutKey).build(content, { canvas, style })
    return {
      id: `sample_${tpl.id}_${layoutKey}`,
      layoutType: layoutKey,
      elements,
      notes: '',
      citationIds: [],
      status: 'draft',
      ...(background ? { background } : {}),
    }
  }

  // layoutOrder가 있으면 시그니처 시퀀스로, 없으면 범용 폴백
  const seq = tpl.layoutOrder && tpl.layoutOrder.length > 0 ? tpl.layoutOrder : FALLBACK_SEQ
  const slides = seq.map(mk).filter((s): s is Slide => s !== null)

  return {
    id: `sample_${tpl.id}`,
    title: tpl.name,
    language: 'ko',
    aspectRatio: '16:9',
    themeId: tpl.themeId,
    templateId: tpl.id,
    slides,
    sources: [],
    citations: [],
    version: 1,
    ...(themeOverride ? { themeOverride } : {}),
  }
}

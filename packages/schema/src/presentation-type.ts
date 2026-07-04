import { z } from 'zod'

/**
 * 발표 유형(ADR-010) — "무슨 발표인가"를 데이터로 표현하는 SSOT.
 *
 * 각 유형은 검증된 서사 프레임워크(STAR·SCQA·IMRaD 등)의 섹션 골격 + 톤 + 디자인 힌트를
 * 담은 레시피다. outline 생성기가 이 골격을 스캐폴드로 주입해 "빈 슬라이드 나열"이 아니라
 * "그 발표 장르가 요구하는 논리 구조"를 만든다.
 *
 * 유형 추가 = 이 배열에 항목 1개 추가(코드 분기 없음). 하드코딩 금지 원칙.
 */

export const presentationTypeIdSchema = z.enum([
  'general',
  'interview',
  'consulting',
  'ir_pitch',
  'academic',
  'sales',
  'lecture',
  'workshop',
  'business_review',
  'product_demo',
])
export type PresentationTypeId = z.infer<typeof presentationTypeIdSchema>

/** 한 발표를 구성하는 논리 비트(슬라이드 역할) — 골격의 최소 단위 */
export const beatSchema = z.object({
  /** 역할 라벨(예: '문제 정의', '핵심 역량') */
  role: z.string().min(1),
  /** 이 비트에서 담아야 할 내용 가이드 */
  hint: z.string().min(1),
  /** 권장 슬라이드 수(기본 1) — 내용 많으면 2~3장으로 분할 */
  slides: z.number().int().min(1).max(4).default(1),
})
export type Beat = z.infer<typeof beatSchema>

export const presentationTypeSchema = z.object({
  id: presentationTypeIdSchema,
  /** 한국어 이름 */
  label: z.string().min(1),
  /** 한 줄 설명 */
  description: z.string().min(1),
  /** 대표 사용처(칩으로 노출) */
  useCases: z.array(z.string()).default([]),
  /** 서사 프레임워크 이름 */
  narrative: z.string().min(1),
  /** 섹션 골격 — 순서 있는 비트 배열 */
  structure: z.array(beatSchema).min(1),
  /** 권장 슬라이드 수 범위 [최소, 최대] */
  slideRange: z.tuple([z.number().int(), z.number().int()]),
  /** 기본 슬라이드 수 */
  defaultSlides: z.number().int().min(1).max(60),
  /** 톤 가이드(프롬프트에 주입) */
  tone: z.string().min(1),
  /** 디자인 방향(색/레이아웃/비주얼) */
  designHints: z.string().min(1),
  /** 장르에 어울리는 기본 테마 id — 사용자가 테마/템플릿 미선택 시 자동 적용(templates 테마 키) */
  defaultThemeId: z.string().min(1),
})
export type PresentationType = z.infer<typeof presentationTypeSchema>

/**
 * 핵심 6종 카탈로그. 딥리서치(면접 STAR·컨설팅 SCQA/Pyramid·IR Kawasaki·학술 IMRaD·세일즈 PAS)
 * 기반으로 실제 그 장르에서 통하는 골격을 코드화.
 */
export const PRESENTATION_TYPES: readonly PresentationType[] = [
  {
    id: 'general',
    label: '일반 발표',
    description: '주제를 균형 있게 전달하는 표준 구조 — 무엇이든 무난하게',
    useCases: ['사내 공유', '교육/강의', '보고'],
    narrative: '두괄식(결론 먼저) + 도입-본론-결론',
    structure: [
      { role: '도입', hint: '주제와 핵심 메시지를 한 문장으로 제시(왜 지금 중요한가)', slides: 1 },
      { role: '본론', hint: '핵심 논점을 근거와 함께 3~5개로 전개(각 논점 = 슬라이드 1장)', slides: 4 },
      { role: '결론', hint: '핵심 요약 + 다음 행동/시사점', slides: 1 },
    ],
    slideRange: [5, 15],
    defaultSlides: 8,
    tone: '명료하고 균형 잡힌, 신뢰감 있는',
    designHints: '절제된 색 1~2개, 요점당 여백 충분히, 도입/결론은 강조 레이아웃',
    defaultThemeId: 'stitch-indigo',
  },
  {
    id: 'interview',
    label: 'PT 면접',
    description: '면접관을 설득하는 자기 PR — STAR로 역량을 증명',
    useCases: ['채용 PT면접', '직무 발표', '인턴/신입 지원'],
    narrative: 'STAR(상황-과제-행동-결과) + 두괄식 자기 PR',
    structure: [
      { role: '오프닝', hint: '한 줄 자기 정의 + 이 발표로 증명할 핵심 강점(두괄식)', slides: 1 },
      { role: '지원 동기·직무 이해', hint: '회사/직무를 왜, 얼마나 이해하는지 — 지원 동기를 직무 요구와 연결', slides: 1 },
      { role: '핵심 역량 (STAR)', hint: '대표 경험 1~2개를 상황→과제→행동→결과로. 결과는 수치로 증명', slides: 2 },
      { role: '입사 후 기여', hint: '내 강점을 이 조직에서 어떻게 성과로 만들지 구체적 계획', slides: 1 },
      { role: '클로징', hint: '핵심 강점 재강조 + 진정성 있는 각오 한 문장', slides: 1 },
    ],
    slideRange: [5, 8],
    defaultSlides: 6,
    tone: '자신감 있고 진정성 있는, 1인칭 능동태, 과장 없이 구체적',
    designHints: '깔끔하고 신뢰감 있는 톤, 절제된 포인트 컬러 1개, STAR는 타임라인/단계 레이아웃, 결과 수치는 크게 강조',
    defaultThemeId: 'deep-navy',
  },
  {
    id: 'consulting',
    label: '컨설팅 제안',
    description: '문제를 진단하고 해법을 논증 — SCQA·피라미드 원칙',
    useCases: ['전략 제안', '프로젝트 제안', '문제 해결 보고'],
    narrative: 'SCQA(상황-복잡성-질문-답) + Minto 피라미드 + MECE',
    structure: [
      { role: '현황 진단', hint: '지금 상태와 배경을 데이터로 — 모두가 동의하는 사실에서 출발', slides: 1 },
      { role: '문제 정의', hint: '무엇이 왜 문제인가(복잡성). 방치 시 손실을 수치로', slides: 1 },
      { role: '원인 분석', hint: 'MECE하게 원인을 구조화. 근본 원인 도출(로직 트리/프레임워크)', slides: 2 },
      { role: '해결 방안', hint: '핵심 답을 먼저, 그 아래 근거. 대안 비교 후 권고안', slides: 2 },
      { role: '실행 로드맵', hint: '단계·일정·책임 — 실행 가능함을 보여줌', slides: 1 },
      { role: '기대 효과', hint: '정량(ROI/절감) + 정성 효과. 투자 대비 회수', slides: 1 },
    ],
    slideRange: [8, 15],
    defaultSlides: 10,
    tone: '논리적이고 단정적, 데이터 기반, 군더더기 없는 프로페셔널',
    designHints: '차트·표·프레임워크 도식 다수, 절제된 남색/회색 팔레트, 슬라이드당 메시지 1개, 근거는 exhibit로 분리',
    defaultThemeId: 'mono-slate',
  },
  {
    id: 'ir_pitch',
    label: 'IR 피치',
    description: '투자자를 설득하는 스타트업 피치 — 문제·시장·트랙션',
    useCases: ['투자 유치', 'IR/데모데이', '사업 소개'],
    narrative: 'Guy Kawasaki 10슬라이드 + 문제-솔루션-시장-트랙션',
    structure: [
      { role: '문제', hint: '크고 절실한 고객 문제를 공감되게. 왜 지금인가', slides: 1 },
      { role: '솔루션', hint: '우리 제품이 그 문제를 어떻게 해결하는지 한눈에', slides: 1 },
      { role: '시장 규모', hint: 'TAM/SAM/SOM으로 기회 크기 증명', slides: 1 },
      { role: '제품·비즈니스 모델', hint: '어떻게 작동하고 어떻게 돈을 버는지', slides: 2 },
      { role: '트랙션', hint: '성장 지표(매출/유저/성장률)로 실행력 증명 — 가장 강한 카드', slides: 1 },
      { role: '경쟁 우위·팀', hint: '왜 우리가 이기는가(해자) + 팀의 실행 역량', slides: 2 },
      { role: '투자 요청', hint: '얼마를 왜 조달하고 어디에 쓸지 + 마일스톤', slides: 1 },
    ],
    slideRange: [9, 13],
    defaultSlides: 11,
    tone: '비전 있고 설득적, 임팩트 있는 단문, 자신감 있되 근거 있는',
    designHints: '큰 수치·핵심 지표 대형 강조, 임팩트 있는 비주얼, 브랜드 컬러 강하게, 트랙션은 성장 차트로',
    defaultThemeId: 'coral-energy',
  },
  {
    id: 'academic',
    label: '학술 발표',
    description: '연구를 객관적으로 전달 — IMRaD 구조',
    useCases: ['학회 발표', '논문 발표', '연구 세미나', '학위 심사'],
    narrative: 'IMRaD(서론-방법-결과-논의)',
    structure: [
      { role: '연구 배경', hint: '분야 맥락과 선행 연구의 공백 — 왜 이 연구가 필요한가', slides: 1 },
      { role: '연구 질문·가설', hint: '명확한 연구 질문/가설 진술', slides: 1 },
      { role: '방법론', hint: '데이터·설계·분석 방법을 재현 가능하게', slides: 2 },
      { role: '결과', hint: '핵심 발견을 그래프/표로. 통계적 근거 제시', slides: 2 },
      { role: '논의', hint: '결과의 의미와 선행 연구와의 관계 해석', slides: 1 },
      { role: '결론·기여', hint: '기여점 요약 + 한계 + 향후 연구', slides: 1 },
    ],
    slideRange: [8, 14],
    defaultSlides: 10,
    tone: '객관적이고 정밀한, 단정 대신 근거 기반, 인용 명시',
    designHints: '그래프·도표 중심, 절제된 학술 팔레트, 각 결과에 출처/통계 표기, 텍스트 최소화',
    defaultThemeId: 'forest-green',
  },
  {
    id: 'sales',
    label: '세일즈 덱',
    description: '고객의 구매를 이끄는 제안 — PAS·고객 가치 중심',
    useCases: ['제품 세일즈', 'B2B 제안', '고객 미팅'],
    narrative: 'PAS(문제-증폭-해결) + Before-After-Bridge',
    structure: [
      { role: '고객 문제', hint: '고객이 겪는 페인포인트를 그들의 언어로(공감)', slides: 1 },
      { role: '방치 비용', hint: '해결 안 하면 잃는 것(기회·비용)을 증폭', slides: 1 },
      { role: '솔루션', hint: '우리 제품이 그리는 After — 문제가 사라진 모습', slides: 1 },
      { role: '차별점·증거', hint: '왜 우리인가 + 데이터/데모로 증명', slides: 2 },
      { role: '고객 사례', hint: '유사 고객 성공 사례·후기(사회적 증거)', slides: 1 },
      { role: 'ROI·다음 단계', hint: '투자 대비 효과 + 명확한 CTA(다음 액션)', slides: 1 },
    ],
    slideRange: [7, 11],
    defaultSlides: 8,
    tone: '고객 중심, 이득을 앞세운 설득적 어조, 신뢰를 주는',
    designHints: '고객 로고·후기 요소, 핵심 수치(ROI/절감) 대형 강조, 강한 CTA 슬라이드, 브랜드 컬러 + 신뢰 톤',
    defaultThemeId: 'royal-purple',
  },
  {
    id: 'lecture',
    label: '교육·강의',
    description: '개념을 단계적으로 가르치는 수업 — 학습목표에서 정리까지',
    useCases: ['강의', '사내 교육', '온라인 클래스', '세미나'],
    narrative: '교수설계(학습목표→개념→예시→정리)',
    structure: [
      { role: '학습 목표', hint: '이 강의로 무엇을 알게 되는지 명확한 목표 제시', slides: 1 },
      { role: '배경·선수 개념', hint: '이해에 필요한 맥락과 전제 지식', slides: 1 },
      { role: '핵심 개념', hint: '핵심 개념을 쉬운 설명 + 도식으로 단계적으로', slides: 2 },
      { role: '예시·적용', hint: '구체적 예시나 실습으로 개념을 체화', slides: 2 },
      { role: '정리·점검', hint: '핵심 요약 + 확인 질문(퀴즈)으로 마무리', slides: 1 },
    ],
    slideRange: [6, 14],
    defaultSlides: 9,
    tone: '명확하고 친절한, 단계적으로 쌓아가는, 예시 중심',
    designHints: '큰 글씨·개념 다이어그램·예시 박스, 밝고 친근한 색, 한 슬라이드 한 개념',
    defaultThemeId: 'stitch-indigo',
  },
  {
    id: 'workshop',
    label: '워크숍·실습',
    description: '참여자가 직접 해보는 실습 세션 — 활동과 회고 중심',
    useCases: ['워크숍', '핸즈온 실습', '팀 빌딩', '디자인 스프린트'],
    narrative: '경험학습(목표→활동→회고)',
    structure: [
      { role: '세션 목표', hint: '오늘 함께 만들 결과물과 진행 방식 안내', slides: 1 },
      { role: '맥락·워밍업', hint: '아이스브레이크 + 왜 이 활동을 하는지', slides: 1 },
      { role: '활동 안내', hint: '실습 규칙·역할·산출물을 명확히', slides: 2 },
      { role: '실습 단계', hint: '단계별 진행 가이드(체크리스트·타이머)', slides: 2 },
      { role: '회고·정리', hint: '결과 공유 + 배운 점 + 다음 행동', slides: 1 },
    ],
    slideRange: [6, 12],
    defaultSlides: 8,
    tone: '참여를 유도하는, 행동 지향, 명령형 안내(“~해보세요”)',
    designHints: '단계 번호·체크리스트·타이머, 활기찬 색, 활동 지시가 눈에 띄게',
    defaultThemeId: 'coral-energy',
  },
  {
    id: 'business_review',
    label: '실적 보고',
    description: '분기·월간 경영 리뷰 — 성과와 리스크를 균형 있게',
    useCases: ['분기 실적 보고', '경영 리뷰', 'QBR', '팀 성과 보고'],
    narrative: '경영 리뷰(요약→성과→차질→계획)',
    structure: [
      { role: '핵심 요약', hint: '한 장으로 이번 기간 총평(잘된 것/아쉬운 것)', slides: 1 },
      { role: '주요 지표', hint: '핵심 KPI를 목표 대비 실적으로', slides: 2 },
      { role: '성과 하이라이트', hint: '가장 큰 성과와 기여 요인', slides: 1 },
      { role: '미달·리스크', hint: '목표 미달 항목과 리스크를 정직하게', slides: 1 },
      { role: '원인·대응', hint: '차질 원인 분석 + 대응 조치', slides: 1 },
      { role: '다음 계획', hint: '다음 기간 목표와 핵심 액션', slides: 1 },
    ],
    slideRange: [6, 12],
    defaultSlides: 8,
    tone: '사실 기반, 성과와 리스크를 균형 있게, 간결하고 단정적',
    designHints: 'KPI 대시보드·추세 차트·신호등(달성/미달), 절제된 기업 색, 목표 대비 강조',
    defaultThemeId: 'deep-navy',
  },
  {
    id: 'product_demo',
    label: '제품 데모',
    description: '제품을 소개하고 가치를 보여주는 데모 — 문제에서 효과까지',
    useCases: ['제품 소개', '기능 데모', '온보딩', '릴리스 소개'],
    narrative: '제품 스토리(문제→기능→가치)',
    structure: [
      { role: '고객 문제', hint: '이 제품이 푸는 고객의 문제를 공감되게', slides: 1 },
      { role: '제품 개요', hint: '무엇을 하는 제품인지 한눈에', slides: 1 },
      { role: '핵심 기능 데모', hint: '대표 기능을 화면·흐름으로 보여줌(before/after)', slides: 3 },
      { role: '차별점', hint: '왜 이 제품인가 — 대안 대비 강점', slides: 1 },
      { role: '도입 효과·다음 단계', hint: '기대 효과 + 시작하는 법(CTA)', slides: 1 },
    ],
    slideRange: [6, 11],
    defaultSlides: 8,
    tone: '제품 가치 중심, 명료하고 자신감 있는, 기능이 아닌 이득을 말하는',
    designHints: '스크린샷·기능 하이라이트·before/after 비교, 브랜드 컬러, 데모 흐름이 보이게',
    defaultThemeId: 'royal-purple',
  },
] as const

/** id로 유형 조회(없으면 general 폴백) */
export function getPresentationType(id: PresentationTypeId): PresentationType {
  return PRESENTATION_TYPES.find((t) => t.id === id) ?? PRESENTATION_TYPES[0]!
}

/**
 * 유형을 outline 프롬프트에 주입할 스캐폴드 텍스트로 렌더.
 * slideCount에 맞춰 골격 비트를 안내하되, 정확한 배분은 생성기가 조정하도록 가이드로 제공.
 */
export function renderScaffold(type: PresentationType): string {
  const beats = type.structure
    .map((b, i) => `  ${i + 1}. ${b.role} (약 ${b.slides}장): ${b.hint}`)
    .join('\n')
  return [
    `발표 유형: ${type.label} — ${type.description}`,
    `서사 프레임워크: ${type.narrative}`,
    `권장 골격(이 순서와 논리를 따르되, 요청 슬라이드 수에 맞게 비트별 장수를 조정):`,
    beats,
    `톤 가이드: ${type.tone}`,
    `디자인 방향: ${type.designHints}`,
  ].join('\n')
}

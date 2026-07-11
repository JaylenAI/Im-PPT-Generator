// Phase B 파생 — PPT 20선의 시그니처 레이아웃/디자인 시스템을 재사용하되
// "비슷하지만 다른 분야·컨셉"으로 확장한 필드 템플릿 14종.
// 각 템플릿 = 분야에 맞는 팔레트 + 기존 시그니처 시퀀스(표지 포함). 신규 레이아웃 코드 없음.
import type { Theme } from '@im-ppt/schema'
import { styleForSystem } from './design-systems.js'

type Sizes = Theme['tokens']['fontSizes']
type Colors = Theme['tokens']['colors']

function t(id: string, name: string, colors: Colors, heading: string, body: string, sizes: Sizes, system: string): Theme {
  return { id, name, tokens: { colors, fonts: { heading, body, mono: 'Courier New' }, fontSizes: sizes, style: styleForSystem(system) } }
}

const BASE: Sizes = { display: 52, title: 33, subtitle: 21, body: 16, caption: 12 }
const POSTER: Sizes = { display: 80, title: 40, subtitle: 22, body: 15, caption: 11 }
const ok = { success: '#2F9E68', warning: '#D08700', error: '#D64545' } as const

export const FIELD_THEMES: Theme[] = [
  // 스타트업 피치 — 강렬한 풀블리드 인디고 표지 + 대시보드/피처
  t('fld-startup-pitch', 'Startup Pitch', { primary: '#4F46E5', secondary: '#9A9AA6', accent: '#4F46E5', background: '#F7F8FB', surface: '#FFFFFF', textPrimary: '#13131C', textSecondary: '#5A5A66', ...ok }, 'Poppins', 'Inter', BASE, 'neo-startup'),
  // 학위 논문 심사 — 네이비+아카데믹 골드, 세리프 에디토리얼
  t('fld-thesis-defense', 'Thesis Defense', { primary: '#1F2A44', secondary: '#9E988C', accent: '#7A6A48', background: '#ECEAE3', surface: '#FFFFFF', textPrimary: '#16161A', textSecondary: '#55555E', ...ok }, 'Oswald', 'Lora', POSTER, 'paper-academic'),
  // 제품 출시 — 코랄 링 표지 + 피처 스토리
  t('fld-product-launch', 'Product Launch', { primary: '#F0533B', secondary: '#AEA9A5', accent: '#F0533B', background: '#F6F3F1', surface: '#FFFFFF', textPrimary: '#221C19', textSecondary: '#5C544F', ...ok }, 'Poppins', 'Inter', BASE, 'warm-organic'),
  // 헬스케어 리포트 — 임상 틸, 스위스 미니멀 데이터
  t('fld-healthcare', 'Healthcare Report', { primary: '#0E7C86', secondary: '#93A0A1', accent: '#0E7C86', background: '#F4F7F7', surface: '#FFFFFF', textPrimary: '#14201F', textSecondary: '#4A5756', ...ok }, 'Lato', 'Lato', BASE, 'swiss-minimal'),
  // 교육 강의 — 친근한 앰버, 단계형
  t('fld-education-course', 'Education Course', { primary: '#E39A16', secondary: '#AAA595', accent: '#E39A16', background: '#FBF8F2', surface: '#FFFFFF', textPrimary: '#23200F', textSecondary: '#5C5747', ...ok }, 'Poppins', 'Inter', BASE, 'neo-startup'),
  // 비영리 연례보고 — 따뜻한 그린, 인포그래픽
  t('fld-nonprofit-annual', 'Nonprofit Annual', { primary: '#3B8C5A', secondary: '#9AA396', accent: '#3B8C5A', background: '#F4F6F2', surface: '#FFFFFF', textPrimary: '#182016', textSecondary: '#4E5648', ...ok }, 'Montserrat', 'Lato', BASE, 'data-infographic'),
  // 부동산 럭셔리 — 차콜+골드, 마스트헤드(라이트)
  t('fld-realestate-luxe', 'Real Estate Luxe', { primary: '#1C1B19', secondary: '#A79F92', accent: '#A98B4E', background: '#F2F0EB', surface: '#FFFFFF', textPrimary: '#1C1B19', textSecondary: '#5A564E', ...ok }, 'Oswald', 'Inter', POSTER, 'poster-bold'),
  // 패션 룩북 — 다크 모노 마스트헤드 + 사진 스트립
  t('fld-fashion-lookbook', 'Fashion Lookbook', { primary: '#0A0A0A', secondary: '#9A9A9A', accent: '#B08D57', background: '#F5F5F4', surface: '#FFFFFF', textPrimary: '#0A0A0A', textSecondary: '#55555A', ...ok }, 'Inter', 'Georgia', POSTER, 'mono-label'),
  // 레스토랑/카페 — 버건디 링 표지
  t('fld-hospitality', 'Restaurant & Café', { primary: '#7A2233', secondary: '#AAA098', accent: '#7A2233', background: '#F6F1EC', surface: '#FFFFFF', textPrimary: '#241417', textSecondary: '#5C4A4C', ...ok }, 'Poppins', 'Inter', BASE, 'warm-organic'),
  // 콘퍼런스 키노트 — 딥 퍼플, 비비드 블록
  t('fld-conference-keynote', 'Conference Keynote', { primary: '#5B2A9E', secondary: '#9E98A6', accent: '#5B2A9E', background: '#F6F5F8', surface: '#FFFFFF', textPrimary: '#1B1622', textSecondary: '#565060', ...ok }, 'Poppins', 'Inter', BASE, 'vivid-block'),
  // 투자자 리뷰 — 포레스트 그린, 컨설팅 그리드
  t('fld-investor-review', 'Investor Review', { primary: '#1F5E3D', secondary: '#9AA39C', accent: '#1F5E3D', background: '#F7F8F7', surface: '#FAFAFA', textPrimary: '#14201A', textSecondary: '#4A564E', ...ok }, 'Montserrat', 'Inter', BASE, 'consulting-grid'),
  // 마케팅 캠페인 — 마젠타, 비비드 블록
  t('fld-marketing-campaign', 'Marketing Campaign', { primary: '#D81E7A', secondary: '#AA9AA3', accent: '#D81E7A', background: '#F8F5F7', surface: '#FFFFFF', textPrimary: '#221520', textSecondary: '#5C4A55', ...ok }, 'Poppins', 'Inter', BASE, 'vivid-block'),
  // 크리에이티브 포트폴리오 — 테라코타, 마스트헤드(라이트)
  t('fld-creative-portfolio', 'Creative Portfolio', { primary: '#B85A3C', secondary: '#A79C93', accent: '#B85A3C', background: '#F3EFEA', surface: '#FFFFFF', textPrimary: '#201713', textSecondary: '#5C5048', ...ok }, 'Oswald', 'Inter', POSTER, 'poster-bold'),
  // 기술 백서 — 슬레이트+시안, 블루프린트
  t('fld-tech-whitepaper', 'Tech Whitepaper', { primary: '#21456B', secondary: '#98A2AB', accent: '#16A0C0', background: '#E8ECEF', surface: '#FFFFFF', textPrimary: '#16202B', textSecondary: '#4C5761', ...ok }, 'Oswald', 'Inter', BASE, 'blueprint-tech'),
]

/** 분야 카테고리 */
export const FIELD_CATEGORY: Record<string, string> = {
  'fld-startup-pitch': 'tech',
  'fld-thesis-defense': 'minimal',
  'fld-product-launch': 'creative',
  'fld-healthcare': 'business',
  'fld-education-course': 'creative',
  'fld-nonprofit-annual': 'business',
  'fld-realestate-luxe': 'creative',
  'fld-fashion-lookbook': 'creative',
  'fld-hospitality': 'creative',
  'fld-conference-keynote': 'business',
  'fld-investor-review': 'business',
  'fld-marketing-campaign': 'creative',
  'fld-creative-portfolio': 'creative',
  'fld-tech-whitepaper': 'tech',
}

/** 분야별 시그니처 시퀀스(표지 포함) */
export const FIELD_SEQ: Record<string, string[]> = {
  'fld-startup-pitch': ['hero-cover', 'statement', 'dashboard-cards', 'feature-grid', 'stat', 'chart', 'split-feature', 'closing'],
  'fld-thesis-defense': ['editorial-cover', 'toc-index', 'section', 'two-col', 'chart', 'timeline', 'comparison', 'closing'],
  'fld-product-launch': ['ring-cover', 'statement', 'feature-grid', 'split-feature', 'stat', 'cards', 'photo-strip', 'closing'],
  'fld-healthcare': ['report-cover', 'agenda', 'stat', 'chart', 'metric-bars', 'process', 'comparison', 'closing'],
  'fld-education-course': ['editorial-cover', 'toc-index', 'steps-circles', 'cards', 'two-col', 'timeline', 'stat', 'closing'],
  'fld-nonprofit-annual': ['report-cover', 'statement', 'stat', 'chart', 'timeline', 'team-grid', 'comparison', 'closing'],
  'fld-realestate-luxe': ['masthead-cover', 'toc-index', 'photo-strip', 'cards', 'stat', 'team-grid', 'closing'],
  'fld-fashion-lookbook': ['masthead-cover', 'photo-strip', 'editorial-headline', 'cards', 'team-grid', 'closing'],
  'fld-hospitality': ['ring-cover', 'cards', 'photo-strip', 'two-col', 'stat', 'closing'],
  'fld-conference-keynote': ['hero-cover', 'agenda', 'section', 'statement', 'stat', 'chart', 'comparison', 'closing'],
  'fld-investor-review': ['report-cover', 'agenda', 'dashboard-cards', 'chart', 'kpi-grid', 'metric-bars', 'comparison', 'closing'],
  'fld-marketing-campaign': ['hero-cover', 'statement', 'feature-grid', 'dashboard-cards', 'chart', 'cards', 'closing'],
  'fld-creative-portfolio': ['masthead-cover', 'toc-index', 'editorial-headline', 'photo-strip', 'metric-bars', 'team-grid', 'closing'],
  'fld-tech-whitepaper': ['editorial-cover', 'toc-index', 'section', 'two-col', 'chart', 'process', 'comparison', 'closing'],
}

/** 다크 마스트헤드를 쓰는 분야 템플릿(검정 표지) */
export const FIELD_DARK_MASTHEAD: Set<string> = new Set(['fld-fashion-lookbook'])

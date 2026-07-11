// AUTO-GENERATED — packages/templates/reference-specs/ppt20.spec.json(R1 실측)에서 생성.
// PPT 샘플 20선을 팔레트 실측 + 발표유형별 레이아웃 시퀀스로 재현한 테마 팩.
// 색은 ImageMagick 히스토그램 실측(무채색/복합색 5종만 육안 보정), 시스템은 측정된 디자인 골격.
import type { Theme } from '@im-ppt/schema'
import { styleForSystem } from './design-systems.js'

type Sizes = Theme['tokens']['fontSizes']
type Colors = Theme['tokens']['colors']

// style을 미리 박아 registry의 withDesignSystem 자동분류가 측정 시스템을 덮지 않게 한다.
function t(id: string, name: string, colors: Colors, heading: string, body: string, sizes: Sizes, system: string): Theme {
  return { id, name, tokens: { colors, fonts: { heading, body, mono: 'Courier New' }, fontSizes: sizes, style: styleForSystem(system) } }
}

export const PPT20_THEMES: Theme[] = [
  t('ppt-01', "Editorial Resume", { primary: '#171716', secondary: '#A29D98', accent: '#171716', background: '#F1F0EC', surface: '#FFFFFF', textPrimary: '#171716', textSecondary: '#5E5D5A', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Oswald', 'Inter', { display: 80, title: 40, subtitle: 22, body: 15, caption: 11 }, 'poster-bold'),
  t('ppt-02', "Indigo Deep", { primary: '#3A32AB', secondary: '#97929D', accent: '#3A32AB', background: '#F6F6F7', surface: '#F6F6F7', textPrimary: '#1E242D', textSecondary: '#97929D', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Montserrat', 'Inter', { display: 46, title: 31, subtitle: 21, body: 16, caption: 12 }, 'consulting-grid'),
  t('ppt-03', "Neon Fitness", { primary: '#2E3A40', secondary: '#6B7A82', accent: '#C2E812', background: '#F7F8F8', surface: '#FFFFFF', textPrimary: '#17201F', textSecondary: '#4A575C', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Poppins', 'Inter', { display: 58, title: 34, subtitle: 21, body: 16, caption: 12 }, 'vivid-block'),
  t('ppt-04', "Olive Pitchbook", { primary: '#6A5532', secondary: '#5D5E57', accent: '#6A5532', background: '#D6D2C8', surface: '#FFFFFF', textPrimary: '#201A14', textSecondary: '#5D5E57', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Archivo', 'Inter', { display: 46, title: 31, subtitle: 21, body: 16, caption: 12 }, 'editorial-serif'),
  t('ppt-05', "HASU Editorial", { primary: '#8F6236', secondary: '#B3A89A', accent: '#8F6236', background: '#D5D1C8', surface: '#FFFFFF', textPrimary: '#151310', textSecondary: '#B3A89A', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Oswald', 'Lora', { display: 80, title: 40, subtitle: 22, body: 15, caption: 11 }, 'paper-academic'),
  t('ppt-06', "Soft Data", { primary: '#34506B', secondary: '#8A97A5', accent: '#7BA7C7', background: '#F9F9F9', surface: '#FFFFFF', textPrimary: '#151516', textSecondary: '#4C555F', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Lato', 'Lato', { display: 46, title: 31, subtitle: 21, body: 16, caption: 12 }, 'swiss-minimal'),
  t('ppt-07', "Business Plan Red", { primary: '#CB252A', secondary: '#AAAAAE', accent: '#CB252A', background: '#FAF9F9', surface: '#FAF9F9', textPrimary: '#16141B', textSecondary: '#AAAAAE', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Montserrat', 'Inter', { display: 58, title: 34, subtitle: 21, body: 16, caption: 12 }, 'consulting-grid'),
  t('ppt-08', "Orange Company", { primary: '#D86A32', secondary: '#B0AFB0', accent: '#D86A32', background: '#F4F4F3', surface: '#F4F4F3', textPrimary: '#241F1C', textSecondary: '#B0AFB0', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Poppins', 'Inter', { display: 58, title: 34, subtitle: 21, body: 16, caption: 12 }, 'warm-organic'),
  t('ppt-09', "Crimson Report", { primary: '#E26E6B', secondary: '#A2A2A0', accent: '#E26E6B', background: '#F2F1F2', surface: '#F2F1F2', textPrimary: '#181A18', textSecondary: '#A2A2A0', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Montserrat', 'Inter', { display: 46, title: 31, subtitle: 21, body: 16, caption: 12 }, 'consulting-grid'),
  t('ppt-10', "Green Modern", { primary: '#52AD47', secondary: '#969C97', accent: '#52AD47', background: '#F8F9F8', surface: '#F8F9F8', textPrimary: '#161B1C', textSecondary: '#969C97', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Poppins', 'Inter', { display: 46, title: 31, subtitle: 21, body: 16, caption: 12 }, 'neo-startup'),
  t('ppt-11', "Glass Fintech", { primary: '#6798D7', secondary: '#9A9CA7', accent: '#6798D7', background: '#CACFD8', surface: '#FFFFFF', textPrimary: '#141425', textSecondary: '#9A9CA7', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Manrope', 'Inter', { display: 46, title: 31, subtitle: 21, body: 16, caption: 12 }, 'glass-gradient'),
  t('ppt-12', "Mint SaaS", { primary: '#6FB975', secondary: '#B1B1B0', accent: '#6FB975', background: '#FAFAFA', surface: '#FAFAFA', textPrimary: '#1A1818', textSecondary: '#B1B1B0', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Poppins', 'Inter', { display: 46, title: 31, subtitle: 21, body: 16, caption: 12 }, 'cloud-soft'),
  t('ppt-13', "FastCo Red", { primary: '#D00304', secondary: '#575555', accent: '#D00304', background: '#FCFCFC', surface: '#FCFCFC', textPrimary: '#1D1311', textSecondary: '#575555', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Archivo', 'Inter', { display: 58, title: 34, subtitle: 21, body: 16, caption: 12 }, 'poster-bold'),
  t('ppt-14', "Strategic Navy", { primary: '#1A3151', secondary: '#B1B0B1', accent: '#1A3151', background: '#DFE0DF', surface: '#FFFFFF', textPrimary: '#2C2F33', textSecondary: '#B1B0B1', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Oswald', 'Inter', { display: 58, title: 34, subtitle: 21, body: 16, caption: 12 }, 'blueprint-tech'),
  t('ppt-15', "Keen Gradient", { primary: '#23CF9E', secondary: '#767171', accent: '#23CF9E', background: '#EDEEEE', surface: '#EDEEEE', textPrimary: '#1B2020', textSecondary: '#767171', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Poppins', 'Inter', { display: 46, title: 31, subtitle: 21, body: 16, caption: 12 }, 'glass-gradient'),
  t('ppt-16', "Red Press", { primary: '#EE362D', secondary: '#9A9493', accent: '#EE362D', background: '#F7F6F7', surface: '#F7F6F7', textPrimary: '#191919', textSecondary: '#9A9493', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Archivo', 'Inter', { display: 58, title: 34, subtitle: 21, body: 16, caption: 12 }, 'brutalist-block'),
  t('ppt-17', "Annual Teal", { primary: '#5CA1D4', secondary: '#AFB0B3', accent: '#5CA1D4', background: '#D7E1E1', surface: '#FFFFFF', textPrimary: '#353047', textSecondary: '#AFB0B3', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Montserrat', 'Lato', { display: 46, title: 31, subtitle: 21, body: 16, caption: 12 }, 'data-infographic'),
  t('ppt-18', "Mono Proposal", { primary: '#0A0A0A', secondary: '#9A9A9A', accent: '#0A0A0A', background: '#F9F9F9', surface: '#FFFFFF', textPrimary: '#0A0A0A', textSecondary: '#55555A', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Inter', 'Georgia', { display: 80, title: 40, subtitle: 22, body: 15, caption: 11 }, 'mono-label'),
  t('ppt-19', "Corporate Blue", { primary: '#6692E5', secondary: '#ACB0B3', accent: '#6692E5', background: '#D1D3D4', surface: '#FFFFFF', textPrimary: '#212C32', textSecondary: '#ACB0B3', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Montserrat', 'Inter', { display: 46, title: 31, subtitle: 21, body: 16, caption: 12 }, 'corporate-outline'),
  t('ppt-20', "Infographic Pop", { primary: '#E23B3B', secondary: '#33406B', accent: '#E23B3B', background: '#F8F7F8', surface: '#FFFFFF', textPrimary: '#2B2627', textSecondary: '#565460', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Montserrat', 'Inter', { display: 46, title: 31, subtitle: 21, body: 16, caption: 12 }, 'data-infographic'),
]

/** 템플릿 메타 카테고리(id→category) */
export const PPT20_CATEGORY: Record<string, string> = {
  'ppt-01': 'creative',
  'ppt-02': 'business',
  'ppt-03': 'creative',
  'ppt-04': 'minimal',
  'ppt-05': 'creative',
  'ppt-06': 'business',
  'ppt-07': 'business',
  'ppt-08': 'creative',
  'ppt-09': 'business',
  'ppt-10': 'tech',
  'ppt-11': 'tech',
  'ppt-12': 'tech',
  'ppt-13': 'business',
  'ppt-14': 'business',
  'ppt-15': 'tech',
  'ppt-16': 'business',
  'ppt-17': 'business',
  'ppt-18': 'minimal',
  'ppt-19': 'business',
  'ppt-20': 'creative',
}

/** 발표유형별 시그니처 레이아웃 시퀀스(layoutOrder) */
export const PPT20_SEQ: Record<string, string[]> = {
  'ppt-01': ['editorial-cover', 'toc-index', 'profile-split', 'metric-bars', 'steps-circles', 'photo-strip', 'team-grid', 'closing'],
  'ppt-02': ['title', 'agenda', 'section', 'two-col', 'stat', 'chart', 'comparison', 'closing'],
  'ppt-03': ['title', 'agenda', 'section', 'split-feature', 'stat', 'metric-bars', 'cards', 'closing'],
  'ppt-04': ['editorial-cover', 'toc-index', 'profile-split', 'section', 'two-col', 'timeline', 'photo-strip', 'closing'],
  'ppt-05': ['editorial-cover', 'toc-index', 'profile-split', 'metric-bars', 'steps-circles', 'photo-strip', 'team-grid', 'closing'],
  'ppt-06': ['title', 'agenda', 'stat', 'chart', 'kpi-grid', 'comparison', 'cards', 'closing'],
  'ppt-07': ['title', 'agenda', 'section', 'two-col', 'stat', 'chart', 'comparison', 'closing'],
  'ppt-08': ['title', 'agenda', 'section', 'two-col', 'stat', 'chart', 'comparison', 'closing'],
  'ppt-09': ['title', 'agenda', 'stat', 'chart', 'kpi-grid', 'comparison', 'cards', 'closing'],
  'ppt-10': ['title', 'statement', 'dashboard-cards', 'feature-grid', 'stat', 'chart', 'split-feature', 'closing'],
  'ppt-11': ['title', 'statement', 'dashboard-cards', 'feature-grid', 'stat', 'chart', 'split-feature', 'closing'],
  'ppt-12': ['title', 'statement', 'dashboard-cards', 'feature-grid', 'stat', 'chart', 'split-feature', 'closing'],
  'ppt-13': ['title', 'agenda', 'section', 'two-col', 'stat', 'chart', 'comparison', 'closing'],
  'ppt-14': ['title', 'agenda', 'section', 'two-col', 'stat', 'chart', 'comparison', 'closing'],
  'ppt-15': ['title', 'statement', 'dashboard-cards', 'feature-grid', 'stat', 'chart', 'split-feature', 'closing'],
  'ppt-16': ['title', 'agenda', 'kpi-grid', 'process', 'chart', 'cards', 'comparison', 'closing'],
  'ppt-17': ['title', 'agenda', 'stat', 'chart', 'kpi-grid', 'comparison', 'cards', 'closing'],
  'ppt-18': ['editorial-cover', 'toc-index', 'profile-split', 'section', 'two-col', 'timeline', 'photo-strip', 'closing'],
  'ppt-19': ['title', 'agenda', 'stat', 'chart', 'kpi-grid', 'comparison', 'cards', 'closing'],
  'ppt-20': ['title', 'agenda', 'kpi-grid', 'process', 'chart', 'cards', 'comparison', 'closing'],
}

/** 웹 로딩 참고용 비-시스템 폰트 목록 */
export const PPT20_FONTS: string[] = ['Oswald', 'Inter', 'Montserrat', 'Poppins', 'Archivo', 'Lora', 'Lato', 'Manrope']

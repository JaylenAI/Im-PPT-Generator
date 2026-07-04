import type { Theme } from '@im-ppt/schema'

/**
 * 갤러리 확장 테마 — Canva/Genspark식 다양한 시각 스타일.
 * 각 테마는 색 팔레트로 정체성을 만든다(다크/파스텔/프리미엄/볼드 등).
 * PPTX 안전 폰트만 사용(exporter가 이름 그대로 사용, ADR-005).
 */
const sizes = { display: 46, title: 31, subtitle: 21, body: 16, caption: 12 }

/** 미드나잇 테크 — 다크, IT/제품/스타트업 */
export const midnightTechTheme: Theme = {
  id: 'midnight-tech',
  name: 'Midnight Tech',
  tokens: {
    colors: {
      primary: '#38BDF8', secondary: '#64748B', accent: '#818CF8',
      background: '#0B1220', surface: '#111A2E', textPrimary: '#E2E8F0', textSecondary: '#94A3B8',
      success: '#34D399', warning: '#FBBF24', error: '#F87171',
    },
    fonts: { heading: 'Arial', body: 'Arial', mono: 'Courier New' },
    fontSizes: sizes,
  },
}

/** 선셋 — 따뜻한 크리에이티브/마케팅 */
export const sunsetTheme: Theme = {
  id: 'sunset-warm',
  name: 'Sunset',
  tokens: {
    colors: {
      primary: '#F97316', secondary: '#A8A29E', accent: '#EF4444',
      background: '#FFFBF5', surface: '#FFF4E6', textPrimary: '#431407', textSecondary: '#9A3412',
      success: '#16A34A', warning: '#EAB308', error: '#DC2626',
    },
    fonts: { heading: 'Verdana', body: 'Helvetica', mono: 'Courier New' },
    fontSizes: sizes,
  },
}

/** 오션 틸 — 신뢰 비즈니스/헬스 */
export const oceanTealTheme: Theme = {
  id: 'ocean-teal',
  name: 'Ocean Teal',
  tokens: {
    colors: {
      primary: '#0D9488', secondary: '#64748B', accent: '#0EA5E9',
      background: '#F0FDFA', surface: '#FFFFFF', textPrimary: '#0F2A2E', textSecondary: '#475569',
      success: '#059669', warning: '#D97706', error: '#DC2626',
    },
    fonts: { heading: 'Arial', body: 'Arial', mono: 'Courier New' },
    fontSizes: sizes,
  },
}

/** 차콜 골드 — 다크 프리미엄/IR/럭셔리 */
export const charcoalGoldTheme: Theme = {
  id: 'charcoal-gold',
  name: 'Charcoal Gold',
  tokens: {
    colors: {
      primary: '#D4AF37', secondary: '#9CA3AF', accent: '#F5D67B',
      background: '#17181C', surface: '#212227', textPrimary: '#F3F4F6', textSecondary: '#B8BCC4',
      success: '#84CC16', warning: '#F59E0B', error: '#EF4444',
    },
    fonts: { heading: 'Georgia', body: 'Helvetica', mono: 'Courier New' },
    fontSizes: sizes,
  },
}

/** 블러시 — 소프트 파스텔/브랜딩/뷰티 */
export const blushTheme: Theme = {
  id: 'blush-pastel',
  name: 'Blush',
  tokens: {
    colors: {
      primary: '#DB2777', secondary: '#A1A1AA', accent: '#F472B6',
      background: '#FFF5F9', surface: '#FFFFFF', textPrimary: '#500724', textSecondary: '#9D174D',
      success: '#059669', warning: '#D97706', error: '#DC2626',
    },
    fonts: { heading: 'Verdana', body: 'Helvetica', mono: 'Courier New' },
    fontSizes: sizes,
  },
}

/** 에메랄드 코퍼레이트 — 금융/컨설팅/성장 */
export const emeraldCorpTheme: Theme = {
  id: 'emerald-corp',
  name: 'Emerald Corporate',
  tokens: {
    colors: {
      primary: '#047857', secondary: '#6B7280', accent: '#10B981',
      background: '#F6FBF9', surface: '#FFFFFF', textPrimary: '#062E24', textSecondary: '#374151',
      success: '#059669', warning: '#CA8A04', error: '#DC2626',
    },
    fonts: { heading: 'Arial', body: 'Arial', mono: 'Courier New' },
    fontSizes: sizes,
  },
}

/** 바이올렛 팝 — 비비드 크리에이티브/이벤트 */
export const violetPopTheme: Theme = {
  id: 'violet-pop',
  name: 'Violet Pop',
  tokens: {
    colors: {
      primary: '#7C3AED', secondary: '#94A3B8', accent: '#EC4899',
      background: '#FAF5FF', surface: '#FFFFFF', textPrimary: '#2E1065', textSecondary: '#5B21B6',
      success: '#16A34A', warning: '#EA580C', error: '#DC2626',
    },
    fonts: { heading: 'Verdana', body: 'Helvetica', mono: 'Courier New' },
    fontSizes: sizes,
  },
}

/** 스틸 블루 — 엔지니어링/B2B/테크 */
export const steelBlueTheme: Theme = {
  id: 'steel-blue',
  name: 'Steel Blue',
  tokens: {
    colors: {
      primary: '#2563EB', secondary: '#64748B', accent: '#0891B2',
      background: '#F5F8FC', surface: '#FFFFFF', textPrimary: '#132038', textSecondary: '#475569',
      success: '#16A34A', warning: '#D97706', error: '#DC2626',
    },
    fonts: { heading: 'Arial', body: 'Arial', mono: 'Courier New' },
    fontSizes: sizes,
  },
}

/** 샌드 — 웜 미니멀/에디토리얼 */
export const sandTheme: Theme = {
  id: 'sand-minimal',
  name: 'Sand',
  tokens: {
    colors: {
      primary: '#B45309', secondary: '#A8A29E', accent: '#78716C',
      background: '#FAF7F0', surface: '#FFFDF8', textPrimary: '#292524', textSecondary: '#57534E',
      success: '#4D7C0F', warning: '#CA8A04', error: '#B91C1C',
    },
    fonts: { heading: 'Georgia', body: 'Helvetica', mono: 'Courier New' },
    fontSizes: sizes,
  },
}

/** 크림슨 볼드 — 강렬 세일즈/캠페인 */
export const crimsonBoldTheme: Theme = {
  id: 'crimson-bold',
  name: 'Crimson Bold',
  tokens: {
    colors: {
      primary: '#BE123C', secondary: '#71717A', accent: '#F43F5E',
      background: '#FFF5F6', surface: '#FFFFFF', textPrimary: '#4C0519', textSecondary: '#9F1239',
      success: '#15803D', warning: '#B45309', error: '#B91C1C',
    },
    fonts: { heading: 'Arial', body: 'Arial', mono: 'Courier New' },
    fontSizes: sizes,
  },
}

export const GALLERY_THEMES: Theme[] = [
  midnightTechTheme, sunsetTheme, oceanTealTheme, charcoalGoldTheme, blushTheme,
  emeraldCorpTheme, violetPopTheme, steelBlueTheme, sandTheme, crimsonBoldTheme,
]

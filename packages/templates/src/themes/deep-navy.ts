import type { Theme } from '@im-ppt/schema'

/** 다크 프리미엄 테마 — IR/피치덱용 (Stitch 사이드바 네이비 계열) */
export const deepNavyTheme: Theme = {
  id: 'deep-navy',
  name: 'Deep Navy',
  tokens: {
    colors: {
      primary: '#818CF8',
      secondary: '#94A3B8',
      accent: '#22D3EE',
      background: '#0F172A',
      surface: '#1E293B',
      textPrimary: '#F8FAFC',
      textSecondary: '#CBD5E1',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
    },
    fonts: {
      heading: 'Arial',
      body: 'Arial',
      mono: 'Courier New',
    },
    fontSizes: {
      display: 44,
      title: 30,
      subtitle: 20,
      body: 15,
      caption: 11,
    },
  },
}

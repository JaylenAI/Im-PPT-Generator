import type { Theme } from '@im-ppt/schema'

/** 라이트 코퍼레이트 테마 — Stitch DESIGN.md 토큰 이식 (docs/04-design/DESIGN_SYSTEM.md) */
export const stitchIndigoTheme: Theme = {
  id: 'stitch-indigo',
  name: 'Professional Indigo',
  tokens: {
    colors: {
      primary: '#4F46E5',
      secondary: '#64748B',
      accent: '#06B6D4',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#BA1A1A',
    },
    fonts: {
      // PPTX 안전 폰트 세트 — exporter가 이름 그대로 사용 (ADR-005)
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

import type { Theme } from '@im-ppt/schema'

const sizes = { display: 46, title: 31, subtitle: 21, body: 16, caption: 12 }

/** 포레스트 — 지속가능/자연/헬스케어 */
export const forestTheme: Theme = {
  id: 'forest-green',
  name: 'Forest Green',
  tokens: {
    colors: {
      primary: '#2F855A', secondary: '#718096', accent: '#68D391',
      background: '#F7FAF7', surface: '#EDF7EE', textPrimary: '#1A202C', textSecondary: '#4A5568',
      success: '#38A169', warning: '#D69E2E', error: '#E53E3E',
    },
    fonts: { heading: 'Georgia', body: 'Helvetica', mono: 'Courier New' },
    fontSizes: sizes,
  },
}

/** 코랄 — 크리에이티브/마케팅/스타트업 */
export const coralTheme: Theme = {
  id: 'coral-energy',
  name: 'Coral Energy',
  tokens: {
    colors: {
      primary: '#E53E3E', secondary: '#A0AEC0', accent: '#F6AD55',
      background: '#FFFBF7', surface: '#FFF0E9', textPrimary: '#2D1B12', textSecondary: '#744210',
      success: '#38A169', warning: '#DD6B20', error: '#C53030',
    },
    fonts: { heading: 'Verdana', body: 'Helvetica', mono: 'Courier New' },
    fontSizes: sizes,
  },
}

/** 모노 슬레이트 — 미니멀/컨설팅/재무 */
export const slateTheme: Theme = {
  id: 'mono-slate',
  name: 'Mono Slate',
  tokens: {
    colors: {
      primary: '#1A202C', secondary: '#718096', accent: '#4299E1',
      background: '#FFFFFF', surface: '#F7FAFC', textPrimary: '#1A202C', textSecondary: '#4A5568',
      success: '#2F855A', warning: '#B7791F', error: '#C53030',
    },
    fonts: { heading: 'Helvetica', body: 'Helvetica', mono: 'Courier New' },
    fontSizes: sizes,
  },
}

/** 로열 퍼플 — 럭셔리/브랜드/이벤트 */
export const royalTheme: Theme = {
  id: 'royal-purple',
  name: 'Royal Purple',
  tokens: {
    colors: {
      primary: '#6B46C1', secondary: '#9F7AEA', accent: '#ED64A6',
      background: '#FAF7FF', surface: '#F3EDFC', textPrimary: '#2A1A4A', textSecondary: '#553C9A',
      success: '#38A169', warning: '#D69E2E', error: '#E53E3E',
    },
    fonts: { heading: 'Georgia', body: 'Helvetica', mono: 'Courier New' },
    fontSizes: sizes,
  },
}

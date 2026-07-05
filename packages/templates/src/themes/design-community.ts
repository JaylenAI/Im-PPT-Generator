import type { Theme } from '@im-ppt/schema'

/**
 * 유명 오픈소스 프레젠테이션 테마 반입(모두 MIT) — 색/폰트 정체성 그대로.
 *  - reveal.js 14종  (https://github.com/hakimel/reveal.js, css/theme/*.scss)
 *  - Catppuccin 4종  (https://github.com/catppuccin/palette 공식 팔레트)
 *  - Marp core 3종   (https://github.com/marp-team/marp-core, themes/*.scss)
 */
const S = { display: 46, title: 31, subtitle: 21, body: 16, caption: 12 }

function cm(id: string, name: string, c: Theme['tokens']['colors'], heading: string, body: string, mono: string): Theme {
  return { id, name, tokens: { colors: c, fonts: { heading, body, mono }, fontSizes: S } }
}

export const COMMUNITY_THEMES: Theme[] = [
  cm('reveal-beige', 'Reveal Beige', { primary: '#8b743d', secondary: '#333333', accent: '#8b743d', background: '#f7f3de', surface: '#f7f3de', textPrimary: '#333333', textSecondary: '#333333', success: '#16A34A', warning: '#CA8A04', error: '#DC2626' }, 'Source Sans 3', 'Source Sans 3', 'JetBrains Mono'),
  cm('reveal-black-contrast', 'Reveal Black Contrast', { primary: '#42affa', secondary: '#ffffff', accent: '#42affa', background: '#000000', surface: '#000000', textPrimary: '#ffffff', textSecondary: '#ffffff', success: '#34D399', warning: '#FBBF24', error: '#F87171' }, 'Source Sans 3', 'Source Sans 3', 'JetBrains Mono'),
  cm('reveal-black', 'Reveal Black', { primary: '#42affa', secondary: '#ffffff', accent: '#42affa', background: '#191919', surface: '#191919', textPrimary: '#ffffff', textSecondary: '#ffffff', success: '#34D399', warning: '#FBBF24', error: '#F87171' }, 'Source Sans 3', 'Source Sans 3', 'JetBrains Mono'),
  cm('reveal-blood', 'Reveal Blood', { primary: '#aa2233', secondary: '#eeeeee', accent: '#aa2233', background: '#222222', surface: '#222222', textPrimary: '#eeeeee', textSecondary: '#eeeeee', success: '#34D399', warning: '#FBBF24', error: '#F87171' }, 'Ubuntu', 'Ubuntu', 'JetBrains Mono'),
  cm('reveal-dracula', 'Reveal Dracula', { primary: '#ff79c6', secondary: '#bd93f9', accent: '#ff79c6', background: '#282a36', surface: '#282a36', textPrimary: '#f8f8f2', textSecondary: '#f8f8f2', success: '#34D399', warning: '#FBBF24', error: '#F87171' }, 'Inter', 'Inter', 'Fira Code'),
  cm('reveal-league', 'Reveal League', { primary: '#13daec', secondary: '#eeeeee', accent: '#13daec', background: '#191919', surface: '#191919', textPrimary: '#eeeeee', textSecondary: '#eeeeee', success: '#34D399', warning: '#FBBF24', error: '#F87171' }, 'League Gothic', 'Lato', 'JetBrains Mono'),
  cm('reveal-moon', 'Reveal Moon', { primary: '#268bd2', secondary: '#eee8d5', accent: '#268bd2', background: '#002b36', surface: '#002b36', textPrimary: '#93a1a1', textSecondary: '#93a1a1', success: '#34D399', warning: '#FBBF24', error: '#F87171' }, 'League Gothic', 'Lato', 'JetBrains Mono'),
  cm('reveal-night', 'Reveal Night', { primary: '#e7ad52', secondary: '#ffffff', accent: '#e7ad52', background: '#111111', surface: '#111111', textPrimary: '#ffffff', textSecondary: '#ffffff', success: '#34D399', warning: '#FBBF24', error: '#F87171' }, 'Montserrat', 'Open Sans', 'JetBrains Mono'),
  cm('reveal-serif', 'Reveal Serif', { primary: '#51483d', secondary: '#383d3d', accent: '#51483d', background: '#f0f1eb', surface: '#f0f1eb', textPrimary: '#000000', textSecondary: '#000000', success: '#16A34A', warning: '#CA8A04', error: '#DC2626' }, 'Palatino Linotype', 'Palatino Linotype', 'JetBrains Mono'),
  cm('reveal-simple', 'Reveal Simple', { primary: '#00008b', secondary: '#000000', accent: '#00008b', background: '#ffffff', surface: '#ffffff', textPrimary: '#000000', textSecondary: '#000000', success: '#16A34A', warning: '#CA8A04', error: '#DC2626' }, 'News Cycle', 'Lato', 'JetBrains Mono'),
  cm('reveal-sky', 'Reveal Sky', { primary: '#2a76dd', secondary: '#333333', accent: '#2a76dd', background: '#f7fbfc', surface: '#f7fbfc', textPrimary: '#333333', textSecondary: '#333333', success: '#16A34A', warning: '#CA8A04', error: '#DC2626' }, 'Quicksand', 'Open Sans', 'JetBrains Mono'),
  cm('reveal-solarized', 'Reveal Solarized', { primary: '#268bd2', secondary: '#586e75', accent: '#268bd2', background: '#fdf6e3', surface: '#fdf6e3', textPrimary: '#657b83', textSecondary: '#657b83', success: '#16A34A', warning: '#CA8A04', error: '#DC2626' }, 'League Gothic', 'Lato', 'JetBrains Mono'),
  cm('reveal-white-contrast', 'Reveal White Contrast', { primary: '#2a76dd', secondary: '#000000', accent: '#2a76dd', background: '#ffffff', surface: '#ffffff', textPrimary: '#000000', textSecondary: '#000000', success: '#16A34A', warning: '#CA8A04', error: '#DC2626' }, 'Source Sans 3', 'Source Sans 3', 'JetBrains Mono'),
  cm('reveal-white', 'Reveal White', { primary: '#2a76dd', secondary: '#222222', accent: '#2a76dd', background: '#ffffff', surface: '#ffffff', textPrimary: '#222222', textSecondary: '#222222', success: '#16A34A', warning: '#CA8A04', error: '#DC2626' }, 'Source Sans 3', 'Source Sans 3', 'JetBrains Mono'),
  cm('catppuccin-latte', 'Catppuccin Latte', { primary: '#8839ef', secondary: '#6c6f85', accent: '#8839ef', background: '#eff1f5', surface: '#e6e9ef', textPrimary: '#4c4f69', textSecondary: '#6c6f85', success: '#40a02b', warning: '#df8e1d', error: '#d20f39' }, 'Inter', 'Inter', 'JetBrains Mono'),
  cm('catppuccin-frappe', 'Catppuccin Frappé', { primary: '#ca9ee6', secondary: '#a5adce', accent: '#ca9ee6', background: '#303446', surface: '#292c3c', textPrimary: '#c6d0f5', textSecondary: '#a5adce', success: '#a6d189', warning: '#e5c890', error: '#e78284' }, 'Inter', 'Inter', 'JetBrains Mono'),
  cm('catppuccin-macchiato', 'Catppuccin Macchiato', { primary: '#c6a0f6', secondary: '#a5adcb', accent: '#c6a0f6', background: '#24273a', surface: '#1e2030', textPrimary: '#cad3f5', textSecondary: '#a5adcb', success: '#a6da95', warning: '#eed49f', error: '#ed8796' }, 'Inter', 'Inter', 'JetBrains Mono'),
  cm('catppuccin-mocha', 'Catppuccin Mocha', { primary: '#cba6f7', secondary: '#a6adc8', accent: '#cba6f7', background: '#1e1e2e', surface: '#181825', textPrimary: '#cdd6f4', textSecondary: '#a6adc8', success: '#a6e3a1', warning: '#f9e2af', error: '#f38ba8' }, 'Inter', 'Inter', 'JetBrains Mono'),
  cm('marp-default', 'Marp Default', { primary: '#0969da', secondary: '#57606a', accent: '#0969da', background: '#ffffff', surface: '#f6f8fa', textPrimary: '#24292e', textSecondary: '#57606a', success: '#16A34A', warning: '#CA8A04', error: '#DC2626' }, 'Inter', 'Inter', 'JetBrains Mono'),
  cm('marp-gaia', 'Marp Gaia', { primary: '#0288d1', secondary: '#68787f', accent: '#0288d1', background: '#fff8e1', surface: '#fdf6d8', textPrimary: '#455a64', textSecondary: '#68787f', success: '#16A34A', warning: '#CA8A04', error: '#DC2626' }, 'Inter', 'Inter', 'Roboto Mono'),
  cm('marp-uncover', 'Marp Uncover', { primary: '#009dd5', secondary: '#5a5c63', accent: '#009dd5', background: '#fdfcff', surface: '#f4f3f7', textPrimary: '#202228', textSecondary: '#5a5c63', success: '#16A34A', warning: '#CA8A04', error: '#DC2626' }, 'Inter', 'Inter', 'Roboto Mono'),
]

export const COMMUNITY_CATEGORY: Record<string, string> = {
  'reveal-beige': 'creative',
  'reveal-black-contrast': 'minimal',
  'reveal-black': 'minimal',
  'reveal-blood': 'creative',
  'reveal-dracula': 'tech',
  'reveal-league': 'tech',
  'reveal-moon': 'tech',
  'reveal-night': 'creative',
  'reveal-serif': 'creative',
  'reveal-simple': 'minimal',
  'reveal-sky': 'creative',
  'reveal-solarized': 'tech',
  'reveal-white-contrast': 'minimal',
  'reveal-white': 'minimal',
  'catppuccin-latte': 'tech',
  'catppuccin-frappe': 'tech',
  'catppuccin-macchiato': 'tech',
  'catppuccin-mocha': 'tech',
  'marp-default': 'minimal',
  'marp-gaia': 'creative',
  'marp-uncover': 'minimal',
}

export const COMMUNITY_FONTS: string[] = [
  'Fira Code',
  'Inter',
  'JetBrains Mono',
  'Lato',
  'League Gothic',
  'Montserrat',
  'News Cycle',
  'Open Sans',
  'Palatino Linotype',
  'Quicksand',
  'Roboto Mono',
  'Source Sans 3',
  'Ubuntu',
]

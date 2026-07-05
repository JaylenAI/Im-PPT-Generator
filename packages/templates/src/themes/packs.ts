import type { Theme } from '@im-ppt/schema'

/**
 * 스타일 팩(P11) — design-diversity 모델의 오리지널 구현.
 * 색상뿐 아니라 **타이포 페어링**(heading/body 조합)까지 팩마다 달리해 진짜 다양성을 만든다.
 * 2026 프레젠테이션 트렌드(웜 톤·소프트 형태·의도적 포인트 컬러) + CRAP 원칙 기반 오리지널.
 * 저작권 안전: 공개 디자인 원칙(색 이론·타이포 계층)으로 만든 우리 자산(상용 템플릿 복제 아님).
 * 폰트는 PPTX 안전 세트만 사용(exporter가 이름 그대로 임베드, ADR-005).
 */
const S = { display: 46, title: 31, subtitle: 21, body: 16, caption: 12 }

function pack(
  id: string,
  name: string,
  colors: Theme['tokens']['colors'],
  heading: string,
  body: string,
): Theme {
  return { id, name, tokens: { colors, fonts: { heading, body, mono: 'Courier New' }, fontSizes: S } }
}

// 라이트 — 웜/뉴트럴/파스텔 계열
const warmSand = pack('pk-warm-sand', 'Warm Sand', { primary: '#B45309', secondary: '#A8A29E', accent: '#D97706', background: '#FAF6EF', surface: '#FFFDF8', textPrimary: '#292524', textSecondary: '#57534E', success: '#4D7C0F', warning: '#CA8A04', error: '#B91C1C' }, 'Georgia', 'Verdana')
const cloudDancer = pack('pk-cloud-dancer', 'Cloud Dancer', { primary: '#4C6EF5', secondary: '#94A3B8', accent: '#22B8CF', background: '#F7F8FA', surface: '#FFFFFF', textPrimary: '#1E293B', textSecondary: '#64748B', success: '#12B886', warning: '#F59F00', error: '#E03131' }, 'Trebuchet MS', 'Helvetica')
const sageCalm = pack('pk-sage-calm', 'Sage Calm', { primary: '#4B7B5B', secondary: '#8A9A8E', accent: '#8FB996', background: '#F4F7F3', surface: '#FFFFFF', textPrimary: '#22312A', textSecondary: '#4B5A50', success: '#3E7A4E', warning: '#B7791F', error: '#C0392B' }, 'Georgia', 'Helvetica')
const lavenderSoft = pack('pk-lavender-soft', 'Lavender Soft', { primary: '#7C6CDB', secondary: '#A5A0C4', accent: '#B79CED', background: '#F8F6FE', surface: '#FFFFFF', textPrimary: '#312A54', textSecondary: '#57508A', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Trebuchet MS', 'Verdana')
const peachCream = pack('pk-peach-cream', 'Peach Cream', { primary: '#E8663C', secondary: '#C0A99E', accent: '#F4A261', background: '#FFF7F2', surface: '#FFFFFF', textPrimary: '#4A2C1E', textSecondary: '#8A5A44', success: '#3E8E5A', warning: '#CC8400', error: '#C0392B' }, 'Georgia', 'Verdana')
const roseGold = pack('pk-rose-gold', 'Rose Gold', { primary: '#C06B7E', secondary: '#B79AA0', accent: '#E0A96D', background: '#FCF5F5', surface: '#FFFFFF', textPrimary: '#3E2530', textSecondary: '#7A5560', success: '#3E8E5A', warning: '#C08A2E', error: '#B54A4A' }, 'Palatino Linotype', 'Helvetica')
const amberWarm = pack('pk-amber-warm', 'Amber Warm', { primary: '#C2830C', secondary: '#A79170', accent: '#E0A100', background: '#FCF8EE', surface: '#FFFFFF', textPrimary: '#3A2E12', textSecondary: '#6B5A38', success: '#4D7C0F', warning: '#B45309', error: '#B91C1C' }, 'Georgia', 'Tahoma')

// 코퍼레이트/테크 — 블루/그린 계열
const steelSlate = pack('pk-steel-slate', 'Steel Slate', { primary: '#2B5C8A', secondary: '#6B7B8C', accent: '#3B9CC2', background: '#F4F7FA', surface: '#FFFFFF', textPrimary: '#1A2733', textSecondary: '#4A5A69', success: '#2F855A', warning: '#B7791F', error: '#C0392B' }, 'Tahoma', 'Arial')
const emeraldPro = pack('pk-emerald-pro', 'Emerald Pro', { primary: '#0F766E', secondary: '#647A79', accent: '#14A89B', background: '#F2FAF8', surface: '#FFFFFF', textPrimary: '#0F2E2B', textSecondary: '#3E5651', success: '#0E9F6E', warning: '#C08A2E', error: '#C0392B' }, 'Trebuchet MS', 'Helvetica')
const indigoInk = pack('pk-indigo-ink', 'Indigo Ink', { primary: '#4338CA', secondary: '#7A80A8', accent: '#6366F1', background: '#F6F6FC', surface: '#FFFFFF', textPrimary: '#1E1B4B', textSecondary: '#4B4A6A', success: '#2F9E68', warning: '#D08700', error: '#D64545' }, 'Arial', 'Arial')

// 미니멀/에디토리얼 — 뉴트럴
const monoInk = pack('pk-mono-ink', 'Mono Ink', { primary: '#111827', secondary: '#9CA3AF', accent: '#4B5563', background: '#FFFFFF', surface: '#F9FAFB', textPrimary: '#0B0F17', textSecondary: '#4B5563', success: '#15803D', warning: '#B45309', error: '#B91C1C' }, 'Helvetica', 'Helvetica')
const editorialSerif = pack('pk-editorial-serif', 'Editorial Serif', { primary: '#1F2937', secondary: '#8A8378', accent: '#9A6A3C', background: '#FBFAF7', surface: '#FFFFFF', textPrimary: '#1C1917', textSecondary: '#57534E', success: '#3E7A4E', warning: '#B7791F', error: '#B54A4A' }, 'Georgia', 'Georgia')

// 다크 — 프리미엄/데이터/테크
const graphiteGold = pack('pk-graphite-gold', 'Graphite Gold', { primary: '#E6B54A', secondary: '#9CA3AF', accent: '#F4D07A', background: '#1A1B1E', surface: '#26272B', textPrimary: '#F3F4F6', textSecondary: '#B4B8C0', success: '#7BC96F', warning: '#F0A030', error: '#F06565' }, 'Palatino Linotype', 'Helvetica')
const dataDark = pack('pk-data-dark', 'Data Dark', { primary: '#38BDF8', secondary: '#64748B', accent: '#22D3EE', background: '#0C1322', surface: '#141C2E', textPrimary: '#E5EDF7', textSecondary: '#93A2B8', success: '#34D399', warning: '#FBBF24', error: '#F87171' }, 'Tahoma', 'Arial')
const nightViolet = pack('pk-night-violet', 'Night Violet', { primary: '#A78BFA', secondary: '#7E829C', accent: '#F472B6', background: '#161225', surface: '#211B36', textPrimary: '#EDE9FB', textSecondary: '#B4ADD0', success: '#5FD08A', warning: '#F4B740', error: '#F87171' }, 'Trebuchet MS', 'Verdana')
const forestNight = pack('pk-forest-night', 'Forest Night', { primary: '#6EE7B7', secondary: '#7C8A82', accent: '#FBBF77', background: '#0E1A15', surface: '#17241E', textPrimary: '#E7F2EC', textSecondary: '#9CB0A6', success: '#5FD08A', warning: '#F0B450', error: '#F08585' }, 'Georgia', 'Helvetica')

export const STYLE_PACK_THEMES: Theme[] = [
  warmSand, cloudDancer, sageCalm, lavenderSoft, peachCream, roseGold, amberWarm,
  steelSlate, emeraldPro, indigoInk, monoInk, editorialSerif,
  graphiteGold, dataDark, nightViolet, forestNight,
]

/** 팩 → 템플릿 메타용 카테고리 매핑(id→category) */
export const STYLE_PACK_CATEGORY: Record<string, string> = {
  'pk-warm-sand': 'minimal', 'pk-cloud-dancer': 'business', 'pk-sage-calm': 'business',
  'pk-lavender-soft': 'creative', 'pk-peach-cream': 'creative', 'pk-rose-gold': 'creative',
  'pk-amber-warm': 'creative', 'pk-steel-slate': 'business', 'pk-emerald-pro': 'business',
  'pk-indigo-ink': 'tech', 'pk-mono-ink': 'minimal', 'pk-editorial-serif': 'minimal',
  'pk-graphite-gold': 'business', 'pk-data-dark': 'tech', 'pk-night-violet': 'creative',
  'pk-forest-night': 'business',
}

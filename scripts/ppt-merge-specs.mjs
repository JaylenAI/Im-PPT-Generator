#!/usr/bin/env node
/**
 * R1 스펙 병합 — 자동 실측 팔레트(ppt-NN.palette.json) + 육안 관찰(패밀리·폰트·시스템·레이아웃·색보정)
 * → ppt-NN.json(템플릿별 완결 스펙) + ppt20.spec.json(SSOT). R3/R4가 이걸 테마·카탈로그로 변환.
 *
 * 색은 실측을 기본으로, 자동분류가 빗나간 5종(무채색/복합색)만 override.colors로 교정.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'packages/templates/reference-specs'
const DEFAULT_SEMANTIC = { success: '#2F9E68', warning: '#D08700', error: '#D64545' }

// 폰트 스케일 프리셋
const SCALE = {
  editorial: { display: 80, title: 40, subtitle: 22, body: 15, caption: 11 },
  bold: { display: 58, title: 34, subtitle: 21, body: 16, caption: 12 },
  base: { display: 46, title: 31, subtitle: 21, body: 16, caption: 12 },
}

// 레이아웃 시퀀스 프리셋(archetype — 일부는 R2에서 신규 제작)
const SEQ = {
  resume: ['editorial-cover', 'toc-index', 'profile-split', 'metric-bars', 'steps-circles', 'photo-strip', 'team-grid', 'closing'],
  pitch: ['title', 'agenda', 'section', 'split-feature', 'stat', 'metric-bars', 'cards', 'closing'],
  business: ['title', 'agenda', 'section', 'two-col', 'stat', 'chart', 'comparison', 'closing'],
  report: ['title', 'agenda', 'stat', 'chart', 'kpi-grid', 'comparison', 'cards', 'closing'],
  saas: ['title', 'statement', 'dashboard-cards', 'feature-grid', 'stat', 'chart', 'split-feature', 'closing'],
  proposal: ['editorial-cover', 'toc-index', 'profile-split', 'section', 'two-col', 'timeline', 'photo-strip', 'closing'],
  infographic: ['title', 'agenda', 'kpi-grid', 'process', 'chart', 'cards', 'comparison', 'closing'],
}

// 샘플별 육안 관찰 메타(family/name/fonts/system/scale/seq) + 필요시 color override
const META = {
  '01': { name: 'Editorial Resume', family: 'editorial-resume', heading: 'Oswald', body: 'Inter', system: 'poster-bold', scale: 'editorial', seq: 'resume',
    colors: { primary: '#171716', secondary: '#A29D98', accent: '#171716', background: '#F1F0EC', surface: '#FFFFFF', textPrimary: '#171716', textSecondary: '#5E5D5A' } },
  '02': { name: 'Indigo Deep', family: 'dark-corporate', heading: 'Montserrat', body: 'Inter', system: 'consulting-grid', scale: 'base', seq: 'business' },
  '03': { name: 'Neon Fitness', family: 'neon-pitch', heading: 'Poppins', body: 'Inter', system: 'vivid-block', scale: 'bold', seq: 'pitch',
    colors: { primary: '#2E3A40', secondary: '#6B7A82', accent: '#C2E812', background: '#F7F8F8', surface: '#FFFFFF', textPrimary: '#17201F', textSecondary: '#4A575C' } },
  '04': { name: 'Olive Pitchbook', family: 'muted-proposal', heading: 'Archivo', body: 'Inter', system: 'editorial-serif', scale: 'base', seq: 'proposal' },
  '05': { name: 'HASU Editorial', family: 'editorial-resume', heading: 'Oswald', body: 'Lora', system: 'paper-academic', scale: 'editorial', seq: 'resume' },
  '06': { name: 'Soft Data', family: 'blue-report', heading: 'Lato', body: 'Lato', system: 'swiss-minimal', scale: 'base', seq: 'report',
    colors: { primary: '#34506B', secondary: '#8A97A5', accent: '#7BA7C7', background: '#F9F9F9', surface: '#FFFFFF', textPrimary: '#151516', textSecondary: '#4C555F' } },
  '07': { name: 'Business Plan Red', family: 'red-bold', heading: 'Montserrat', body: 'Inter', system: 'consulting-grid', scale: 'bold', seq: 'business' },
  '08': { name: 'Orange Company', family: 'warm-orange', heading: 'Poppins', body: 'Inter', system: 'warm-organic', scale: 'bold', seq: 'business' },
  '09': { name: 'Crimson Report', family: 'red-bold', heading: 'Montserrat', body: 'Inter', system: 'consulting-grid', scale: 'base', seq: 'report' },
  '10': { name: 'Green Modern', family: 'green-startup', heading: 'Poppins', body: 'Inter', system: 'neo-startup', scale: 'base', seq: 'saas' },
  '11': { name: 'Glass Fintech', family: 'glass-app', heading: 'Manrope', body: 'Inter', system: 'glass-gradient', scale: 'base', seq: 'saas' },
  '12': { name: 'Mint SaaS', family: 'green-startup', heading: 'Poppins', body: 'Inter', system: 'cloud-soft', scale: 'base', seq: 'saas' },
  '13': { name: 'FastCo Red', family: 'red-bold', heading: 'Archivo', body: 'Inter', system: 'poster-bold', scale: 'bold', seq: 'business' },
  '14': { name: 'Strategic Navy', family: 'dark-corporate', heading: 'Oswald', body: 'Inter', system: 'blueprint-tech', scale: 'bold', seq: 'business' },
  '15': { name: 'Keen Gradient', family: 'green-startup', heading: 'Poppins', body: 'Inter', system: 'glass-gradient', scale: 'base', seq: 'saas' },
  '16': { name: 'Red Press', family: 'red-bold', heading: 'Archivo', body: 'Inter', system: 'brutalist-block', scale: 'bold', seq: 'infographic' },
  '17': { name: 'Annual Teal', family: 'blue-report', heading: 'Montserrat', body: 'Lato', system: 'data-infographic', scale: 'base', seq: 'report' },
  '18': { name: 'Mono Proposal', family: 'mono-editorial', heading: 'Inter', body: 'Georgia', system: 'mono-label', scale: 'editorial', seq: 'proposal',
    colors: { primary: '#0A0A0A', secondary: '#9A9A9A', accent: '#0A0A0A', background: '#F9F9F9', surface: '#FFFFFF', textPrimary: '#0A0A0A', textSecondary: '#55555A' } },
  '19': { name: 'Corporate Blue', family: 'blue-report', heading: 'Montserrat', body: 'Inter', system: 'corporate-outline', scale: 'base', seq: 'report' },
  '20': { name: 'Infographic Pop', family: 'multicolor-infographic', heading: 'Montserrat', body: 'Inter', system: 'data-infographic', scale: 'base', seq: 'infographic',
    colors: { primary: '#E23B3B', secondary: '#33406B', accent: '#E23B3B', background: '#F8F7F8', surface: '#FFFFFF', textPrimary: '#2B2627', textSecondary: '#565460' } },
}

const CATEGORY = {
  'editorial-resume': 'creative', 'dark-corporate': 'business', 'neon-pitch': 'creative',
  'muted-proposal': 'minimal', 'blue-report': 'business', 'red-bold': 'business',
  'warm-orange': 'creative', 'green-startup': 'tech', 'glass-app': 'tech',
  'mono-editorial': 'minimal', 'multicolor-infographic': 'creative',
}

const palettes = readdirSync(DIR).filter((f) => /^ppt-\d\d\.palette\.json$/.test(f)).sort()
const specs = []
for (const pf of palettes) {
  const id = pf.slice(4, 6)
  const measured = JSON.parse(readFileSync(join(DIR, pf), 'utf8'))
  const m = META[id]
  if (!m) { console.warn(`메타 없음: ${id}`); continue }
  const colors = { ...measured.colors, ...(m.colors ?? {}), ...DEFAULT_SEMANTIC }
  const spec = {
    id: `ppt-${id}`,
    name: m.name,
    family: m.family,
    category: CATEGORY[m.family],
    darkTheme: measured.darkTheme,
    colors,
    fonts: { heading: m.heading, body: m.body, mono: 'Courier New' },
    fontSizes: SCALE[m.scale],
    system: m.system,
    layoutSequence: SEQ[m.seq],
    measuredAccent: measured.colors.accent,
    accentCorrected: !!m.colors,
    source: measured.source,
  }
  writeFileSync(join(DIR, `ppt-${id}.json`), JSON.stringify(spec, null, 2))
  specs.push(spec)
}
writeFileSync(join(DIR, 'ppt20.spec.json'), JSON.stringify(specs, null, 2))

// 요약 출력
console.log('id     name                 family                 accent    system           seq')
for (const s of specs) {
  console.log(
    `${s.id}  ${s.name.padEnd(20)} ${s.family.padEnd(22)} ${s.colors.accent}  ${s.system.padEnd(16)} ${s.layoutSequence.length}슬롯${s.accentCorrected ? ' *보정' : ''}`,
  )
}
// 신규 레이아웃 집계
const KNOWN = new Set(['title', 'agenda', 'bullets', 'two-col', 'stat', 'quote', 'chart', 'process', 'timeline', 'comparison', 'kpi-grid', 'cards', 'bignum', 'roadmap', 'section', 'statement', 'feature-quote', 'split-feature', 'hero-image', 'feature-grid', 'closing', 'references'])
const used = new Set(specs.flatMap((s) => s.layoutSequence))
const need = [...used].filter((k) => !KNOWN.has(k))
console.log(`\n신규 필요 레이아웃(${need.length}): ${need.join(', ')}`)
console.log(`패밀리(${new Set(specs.map((s) => s.family)).size}): ${[...new Set(specs.map((s) => s.family))].join(', ')}`)
console.log(`${specs.length}개 스펙 → ${DIR}/ppt20.spec.json`)

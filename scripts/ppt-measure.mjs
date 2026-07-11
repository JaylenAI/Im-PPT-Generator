#!/usr/bin/env node
/**
 * PPT 샘플 팔레트 실측(R1) — ImageMagick 히스토그램 → 채도/명도 분류로 테마 토큰 후보 산출.
 * 색 분류는 P12.4 브랜드 URL 추출(url-extract.ts)과 동일 원칙: near-white/near-black을 배경/텍스트로,
 * 채도 높은 색을 accent로. 덱 전체 이미지라 배경(흰/크림/다크)·accent(레드/그린 등)가 안정적으로 드러남.
 *
 * 사용: node scripts/ppt-measure.mjs <이미지디렉토리> <출력디렉토리>
 * 출력: <출력>/ppt-NN.palette.json (팔레트만; 폰트·레이아웃 인벤토리는 육안으로 병합)
 */
import { execSync } from 'node:child_process'
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, basename } from 'node:path'

const [, , IMG_DIR, OUT_DIR] = process.argv
if (!IMG_DIR || !OUT_DIR) {
  console.error('사용: node scripts/ppt-measure.mjs <이미지디렉토리> <출력디렉토리>')
  process.exit(1)
}
mkdirSync(OUT_DIR, { recursive: true })

/** #RRGGBB → {r,g,b} 0..255 */
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
}
/** 상대 휘도 0..1 (sRGB 근사) */
function luminance({ r, g, b }) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}
/** HSL 채도 0..1 */
function saturation({ r, g, b }) {
  const R = r / 255, G = g / 255, B = b / 255
  const max = Math.max(R, G, B), min = Math.min(R, G, B)
  const l = (max + min) / 2
  if (max === min) return 0
  const d = max - min
  return l > 0.5 ? d / (2 - max - min) : d / (max + min)
}
function toHex({ r, g, b }) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
}

/** ImageMagick 히스토그램 → [{hex, rgb, count, lum, sat}] (빈도순) */
function histogram(file, colors = 28) {
  const out = execSync(
    `magick "${file}" -resize 30% -colors ${colors} -depth 8 -format "%c" histogram:info:`,
    { encoding: 'utf8', maxBuffer: 1 << 24 },
  )
  const rows = []
  for (const line of out.split('\n')) {
    const m = line.match(/^\s*(\d+):\s*\([^)]*\)\s*(#[0-9A-Fa-f]{6})/)
    if (!m) continue
    const count = parseInt(m[1], 10)
    const hex = m[2].toUpperCase()
    const rgb = hexToRgb(hex)
    rows.push({ hex, rgb, count, lum: luminance(rgb), sat: saturation(rgb) })
  }
  return rows.sort((a, b) => b.count - a.count)
}

/** 색 후보에서 테마 토큰 역할 배정 */
function classify(rows) {
  const total = rows.reduce((s, r) => s + r.count, 0)
  // 배경 = 최빈 저채도(밝거나 어두운) 색
  const bgCand = rows.filter((r) => r.sat < 0.22 && (r.lum > 0.8 || r.lum < 0.16))
  const background = (bgCand[0] ?? rows[0])
  const darkTheme = background.lum < 0.5
  // 텍스트 = 배경 반대 극단의 저채도 색
  const textCand = rows
    .filter((r) => r.sat < 0.3 && (darkTheme ? r.lum > 0.8 : r.lum < 0.28))
    .sort((a, b) => (darkTheme ? b.lum - a.lum : a.lum - b.lum))
  const textPrimary = textCand[0]?.hex ?? (darkTheme ? '#F5F5F5' : '#1A1A1A')
  // accent = 채도 높고 중간 명도인 최빈 색(진짜 브랜드 컬러)
  const accentCand = rows
    .filter((r) => r.sat >= 0.32 && r.lum > 0.16 && r.lum < 0.78)
    .sort((a, b) => b.count * (0.5 + b.sat) - a.count * (0.5 + a.sat))
  const accent = accentCand[0]
  // primary = accent(없으면 강한 저채도 다크/브랜드) ; secondary = 중간 회색
  const grayCand = rows.filter((r) => r.sat < 0.2 && r.lum > 0.3 && r.lum < 0.75)
  const secondary = grayCand[0]?.hex ?? '#8A8A8A'
  const primary = accent?.hex ?? (darkTheme ? textPrimary : background.hex)
  // surface = 배경 근처(밝은 테마=흰/약간 오프, 다크=약간 밝은 패널)
  const surfaceCand = rows.filter((r) => r.sat < 0.2 && (darkTheme ? r.lum > background.lum + 0.05 && r.lum < 0.5 : r.lum > 0.9))
  const surface = surfaceCand[0]?.hex ?? (darkTheme ? '#222222' : '#FFFFFF')

  return {
    darkTheme,
    colors: {
      primary,
      secondary,
      accent: accent?.hex ?? primary,
      background: background.hex,
      surface,
      textPrimary,
      textSecondary: secondary,
    },
    accentSat: accent ? Number(accent.sat.toFixed(2)) : 0,
    topColors: rows.slice(0, 8).map((r) => ({ hex: r.hex, pct: Number(((r.count / total) * 100).toFixed(1)), sat: Number(r.sat.toFixed(2)), lum: Number(r.lum.toFixed(2)) })),
  }
}

const files = readdirSync(IMG_DIR).filter((f) => /^\d\d\.jpg$/.test(f)).sort()
const summary = []
for (const f of files) {
  const id = basename(f, '.jpg')
  const rows = histogram(join(IMG_DIR, f))
  const c = classify(rows)
  const spec = { id: `ppt-${id}`, source: f, darkTheme: c.darkTheme, colors: c.colors, accentSat: c.accentSat, topColors: c.topColors }
  writeFileSync(join(OUT_DIR, `ppt-${id}.palette.json`), JSON.stringify(spec, null, 2))
  summary.push(`${id}  bg=${c.colors.background} accent=${c.colors.accent}(s${c.accentSat}) text=${c.colors.textPrimary} ${c.darkTheme ? 'DARK' : 'light'}`)
}
console.log(summary.join('\n'))
console.log(`\n${files.length}개 팔레트 → ${OUT_DIR}`)

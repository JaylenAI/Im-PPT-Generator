import type { ChartElement, ThemeTokens } from '@im-ppt/schema'
import { resolveCssColor } from '../theme-context.js'

/** 의존성 없는 인라인 SVG 차트 — SSR 안전. bar/hbar/line/area/pie/donut/scatter 최소 렌더 */
export function ChartView({ el, tokens }: { el: ChartElement; tokens: ThemeTokens }) {
  const w = el.frame.w
  const h = el.frame.h
  const palette = (el.options.palette ?? [
    'token:colors.primary',
    'token:colors.accent',
    'token:colors.secondary',
    'token:colors.success',
  ]).map((c) => resolveCssColor(c, tokens))
  const color = (i: number) => palette[i % palette.length] ?? '#4F46E5'

  const all = el.data.series.flatMap((s) => s.values)
  const max = Math.max(1, ...all)
  const pad = 8

  if (el.chartType === 'pie' || el.chartType === 'donut') {
    return <PieChart el={el} size={Math.min(w, h)} color={color} donut={el.chartType === 'donut'} />
  }

  // bar/hbar/line/area/scatter는 카테시안 좌표로 근사
  const plotW = w - pad * 2
  const plotH = h - pad * 2
  const n = el.data.labels.length
  const groupW = plotW / Math.max(1, n)

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      {el.data.series.map((s, si) =>
        el.chartType === 'line' || el.chartType === 'area' || el.chartType === 'scatter' ? (
          <LineSeries
            key={si}
            values={s.values}
            groupW={groupW}
            plotH={plotH}
            pad={pad}
            max={max}
            fill={el.chartType === 'area'}
            dots={el.chartType === 'scatter'}
            stroke={color(si)}
          />
        ) : (
          <g key={si}>
            {s.values.map((v, i) => {
              const barW = (groupW * 0.7) / el.data.series.length
              const bx = pad + i * groupW + groupW * 0.15 + si * barW
              const bh = (v / max) * plotH
              return (
                <rect
                  key={i}
                  x={bx}
                  y={pad + plotH - bh}
                  width={Math.max(1, barW - 2)}
                  height={bh}
                  fill={color(si)}
                  rx={2}
                />
              )
            })}
          </g>
        ),
      )}
    </svg>
  )
}

function LineSeries({
  values, groupW, plotH, pad, max, fill, dots, stroke,
}: {
  values: number[]; groupW: number; plotH: number; pad: number; max: number
  fill: boolean; dots: boolean; stroke: string
}) {
  const pts = values.map((v, i) => ({
    x: pad + i * groupW + groupW / 2,
    y: pad + plotH - (v / max) * plotH,
  }))
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  return (
    <g>
      {fill && (
        <path
          d={`${line} L${pts[pts.length - 1]?.x ?? 0},${pad + plotH} L${pts[0]?.x ?? 0},${pad + plotH} Z`}
          fill={stroke}
          opacity={0.15}
        />
      )}
      {!dots && <path d={line} fill="none" stroke={stroke} strokeWidth={2} />}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={dots ? 4 : 3} fill={stroke} />
      ))}
    </g>
  )
}

function PieChart({
  el, size, color, donut,
}: {
  el: ChartElement; size: number; color: (i: number) => string; donut: boolean
}) {
  const r = size / 2
  const values = el.data.series[0]?.values ?? []
  const total = Math.max(1, values.reduce((a, b) => a + b, 0))
  let angle = -Math.PI / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {values.map((v, i) => {
        const slice = (v / total) * Math.PI * 2
        const x1 = r + r * Math.cos(angle)
        const y1 = r + r * Math.sin(angle)
        angle += slice
        const x2 = r + r * Math.cos(angle)
        const y2 = r + r * Math.sin(angle)
        const large = slice > Math.PI ? 1 : 0
        return (
          <path
            key={i}
            d={`M${r},${r} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`}
            fill={color(i)}
          />
        )
      })}
      {donut && <circle cx={r} cy={r} r={r * 0.55} fill="#ffffff" />}
    </svg>
  )
}

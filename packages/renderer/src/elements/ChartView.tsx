import type { ChartElement, ThemeTokens } from '@im-ppt/schema'
import { computeWaterfall } from '@im-ppt/schema'
import { resolveCssColor } from '../theme-context.js'

/** 의존성 없는 인라인 SVG 차트 — SSR 안전. bar/hbar/line/area/pie/donut/scatter/waterfall 최소 렌더 */
export function ChartView({ el, tokens }: { el: ChartElement; tokens: ThemeTokens }) {
  const w = el.frame.w
  const h = el.frame.h

  if (el.chartType === 'waterfall') {
    return <WaterfallChart el={el} tokens={tokens} w={w} h={h} />
  }
  const palette = (el.options.palette ?? [
    'token:colors.primary',
    'token:colors.accent',
    'token:colors.secondary',
    'token:colors.success',
  ]).map((c) => resolveCssColor(c, tokens))
  const color = (i: number) => palette[i % palette.length] ?? '#4F46E5'

  // 데이터 스토리텔링(ADR-011) — 강조 포인트가 있으면 그 외는 흐리게(핵심 수치 부각)
  const hi = el.options.highlightIndex
  const hiColor = resolveCssColor('token:colors.accent', tokens)
  // 강조 인덱스가 있을 때 i번째 막대/점의 채움색과 불투명도
  const barFill = (i: number, si: number) => (hi !== undefined && i === hi ? hiColor : color(si))
  const barOpacity = (i: number) => (hi !== undefined && i !== hi ? 0.35 : 1)

  const all = el.data.series.flatMap((s) => s.values)
  const max = Math.max(1, ...all)
  const pad = 8

  if (el.chartType === 'pie' || el.chartType === 'donut') {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
        <PieChart el={el} size={Math.min(w, h)} color={color} hi={hi} hiColor={hiColor} donut={el.chartType === 'donut'} />
      </svg>
    )
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
            hi={hi}
            hiColor={hiColor}
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
                  fill={barFill(i, si)}
                  opacity={barOpacity(i)}
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
  values, groupW, plotH, pad, max, fill, dots, stroke, hi, hiColor,
}: {
  values: number[]; groupW: number; plotH: number; pad: number; max: number
  fill: boolean; dots: boolean; stroke: string; hi: number | undefined; hiColor: string
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
      {pts.map((p, i) => {
        const on = hi !== undefined && i === hi
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={on ? 6 : dots ? 4 : 3}
            fill={on ? hiColor : stroke}
            opacity={hi !== undefined && !on ? 0.35 : 1}
          />
        )
      })}
    </g>
  )
}

function PieChart({
  el, size, color, donut, hi, hiColor,
}: {
  el: ChartElement; size: number; color: (i: number) => string; donut: boolean
  hi: number | undefined; hiColor: string
}) {
  const r = size / 2
  const values = el.data.series[0]?.values ?? []
  const total = Math.max(1, values.reduce((a, b) => a + b, 0))
  let angle = -Math.PI / 2
  return (
    <g>
      {values.map((v, i) => {
        const slice = (v / total) * Math.PI * 2
        const x1 = r + r * Math.cos(angle)
        const y1 = r + r * Math.sin(angle)
        angle += slice
        const x2 = r + r * Math.cos(angle)
        const y2 = r + r * Math.sin(angle)
        const large = slice > Math.PI ? 1 : 0
        const on = hi !== undefined && i === hi
        return (
          <path
            key={i}
            d={`M${r},${r} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`}
            fill={on ? hiColor : color(i)}
            opacity={hi !== undefined && !on ? 0.4 : 1}
          />
        )
      })}
      {donut && <circle cx={r} cy={r} r={r * 0.55} fill="#ffffff" />}
    </g>
  )
}

/** 워터폴 차트 — 순차 증감이 누적에 미치는 영향을 떠 있는 막대로. 증가=success, 감소=error, 총계=primary */
function WaterfallChart({ el, tokens, w, h }: { el: ChartElement; tokens: ThemeTokens; w: number; h: number }) {
  const values = el.data.series[0]?.values ?? []
  const wf = computeWaterfall(values, el.options.waterfallTotalLast ?? false)
  const upColor = resolveCssColor('token:colors.success', tokens)
  const downColor = resolveCssColor('token:colors.error', tokens)
  const totalColor = resolveCssColor('token:colors.primary', tokens)
  const gridColor = resolveCssColor('token:colors.textSecondary', tokens)

  const pad = 8
  const plotW = w - pad * 2
  const plotH = h - pad * 2
  const n = values.length
  const groupW = plotW / Math.max(1, n)
  const span = wf.axisMax - wf.axisMin || 1
  // 값 → y좌표(위가 큰 값)
  const y = (v: number) => pad + plotH - ((v - wf.axisMin) / span) * plotH
  const zeroY = y(0)

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      {/* 0 기준선 */}
      <line x1={pad} y1={zeroY} x2={pad + plotW} y2={zeroY} stroke={gridColor} strokeWidth={1} opacity={0.3} />
      {values.map((_, i) => {
        const barW = groupW * 0.6
        const bx = pad + i * groupW + groupW * 0.2
        const bottom = wf.base[i]!
        const height = wf.rise[i]! + wf.fall[i]!
        const top = bottom + height
        const yTop = y(top)
        const yBottom = y(bottom)
        const fill = wf.isTotal[i] ? totalColor : wf.rise[i]! > 0 ? upColor : downColor
        // 누적 연결선(다음 막대로)
        const connX2 = pad + (i + 1) * groupW + groupW * 0.2
        return (
          <g key={i}>
            <rect x={bx} y={yTop} width={Math.max(1, barW)} height={Math.max(1, yBottom - yTop)} fill={fill} rx={2} />
            {i < n - 1 && !wf.isTotal[i] && (
              <line x1={bx + barW} y1={y(wf.cum[i]!)} x2={connX2} y2={y(wf.cum[i]!)} stroke={gridColor} strokeWidth={1} strokeDasharray="3 2" opacity={0.4} />
            )}
          </g>
        )
      })}
    </svg>
  )
}

import { getLayout } from '@im-ppt/templates'
import { CANVAS_SIZES, type Deck } from '@im-ppt/schema'
import { newDeckId } from './ids.js'

export interface ChartData {
  labels: string[]
  series: { name: string; values: number[] }[]
}

/**
 * CSV → 차트 데이터(P7). 첫 열=라벨, 나머지 열=계열(헤더=계열명).
 * 예) Month,Sales,Cost / Jan,100,60 → labels [Jan], series [Sales:[100], Cost:[60]]
 */
export function parseCsvToChart(csv: string): ChartData {
  const rows = csv
    .trim()
    .split(/\r?\n/)
    .map((r) => r.split(',').map((c) => c.trim()))
  if (rows.length < 2) throw new Error('CSV에 헤더+데이터 행이 필요합니다')
  const header = rows[0]!
  const dataRows = rows.slice(1).filter((r) => r[0])
  const labels = dataRows.map((r) => r[0]!).slice(0, 12)
  const series = header
    .slice(1)
    .map((name, ci) => ({
      name: (name || `계열${ci + 1}`).slice(0, 30),
      values: dataRows.map((r) => Number(r[ci + 1])).map((v) => (Number.isFinite(v) ? v : 0)).slice(0, 12),
    }))
    .filter((s) => s.values.some((v) => v !== 0))
    .slice(0, 4)
  if (labels.length === 0 || series.length === 0) throw new Error('CSV에서 유효한 숫자 데이터를 찾지 못했습니다')
  return { labels, series }
}

/** CSV 차트 데이터 → 단일 차트 슬라이드 덱 */
export function buildChartDeck(
  data: ChartData,
  opts: { title?: string; chartType?: string } = {},
): Deck {
  const title = opts.title?.trim() || '데이터 차트'
  const chartType = opts.chartType ?? 'bar'
  const layout = getLayout('chart')
  const { background, elements } = layout.build(
    { title, chartType, data },
    { canvas: CANVAS_SIZES['16:9'] },
  )
  return {
    id: newDeckId(),
    title,
    language: 'ko',
    aspectRatio: '16:9',
    themeId: 'stitch-indigo',
    slides: [
      {
        id: 'slide_1',
        layoutType: 'chart',
        elements,
        notes: '',
        citationIds: [],
        status: 'draft',
        ...(background ? { background } : {}),
      },
    ],
    sources: [],
    citations: [],
    version: 1,
  }
}

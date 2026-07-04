import type pptxgen from 'pptxgenjs'
import type { SlideElement, ThemeTokens } from '@im-ppt/schema'
import { pxToInch, resolveColor, fontSizePt, fontFace } from './units.js'

type PptxSlide = pptxgen.Slide
type Pptx = pptxgen

/** 요소 frame → PptxGenJS 위치(inch) */
function pos(el: SlideElement) {
  return {
    x: pxToInch(el.frame.x),
    y: pxToInch(el.frame.y),
    w: pxToInch(el.frame.w),
    h: pxToInch(el.frame.h),
  }
}

/** undefined 키를 제거(exactOptionalPropertyTypes 경계에서 pptxgenjs 옵션으로 넘기기 전) */
function clean<T>(obj: Record<string, unknown>): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v
  return out as T
}

const CHART_TYPE: Record<string, string> = {
  bar: 'bar',
  horizontalBar: 'bar',
  line: 'line',
  area: 'area',
  pie: 'pie',
  donut: 'doughnut',
  scatter: 'scatter',
}

/**
 * 슬라이드 요소 1개를 PptxGenJS 슬라이드에 추가.
 * 요소 7종 전체를 매핑(CODING_STANDARDS 요소 추가 절차 — 웹/PPTX 동시 지원).
 */
export function addElement(
  pptx: Pptx,
  slide: PptxSlide,
  el: SlideElement,
  tokens: ThemeTokens,
): void {
  const p = pos(el)
  const transparency = el.opacity < 1 ? Math.round((1 - el.opacity) * 100) : undefined

  switch (el.type) {
    case 'text': {
      slide.addText(
        el.content,
        clean<pptxgen.TextPropsOptions>({
          ...p,
          rotate: el.rotation || undefined,
          fontSize: fontSizePt(tokens, el.role, el.style.fontSize),
          fontFace: fontFace(tokens, el.role),
          color: resolveColor(el.style.color ?? 'token:colors.textPrimary', tokens),
          bold: el.style.fontWeight === 'bold' || el.style.fontWeight === 'semibold',
          align: el.style.align ?? 'left',
          valign: 'top',
          lineSpacingMultiple: el.style.lineHeight,
          transparency,
        }),
      )
      break
    }
    case 'list': {
      const runs = el.items.map((text) => ({
        text,
        options: clean<pptxgen.TextPropsOptions>({
          // breakLine로 각 항목을 별도 문단으로 → 번호 자동 증가(PptxGenJS 정렬 이슈 해결)
          breakLine: true,
          bullet: el.marker === 'number' ? { type: 'number' } : true,
          fontSize: fontSizePt(tokens, undefined, el.style.fontSize),
          color: resolveColor(el.style.color ?? 'token:colors.textPrimary', tokens),
          fontFace: tokens.fonts.body,
        }),
      }))
      slide.addText(
        runs,
        clean<pptxgen.TextPropsOptions>({ ...p, valign: 'top', lineSpacingMultiple: el.style.lineHeight }),
      )
      break
    }
    case 'shape': {
      const shapeType =
        el.shape === 'ellipse'
          ? 'ellipse'
          : el.shape === 'line' || el.shape === 'arrow'
            ? 'line'
            : 'roundRect'
      const fill = el.fill
        ? clean<pptxgen.ShapeFillProps>({ color: resolveColor(el.fill, tokens), transparency })
        : { type: 'none' as const }
      slide.addShape(
        shapeType as pptxgen.SHAPE_NAME,
        clean<pptxgen.ShapeProps>({
          ...p,
          rotate: el.rotation || undefined,
          fill,
          line: el.stroke
            ? { color: resolveColor(el.stroke.color, tokens), width: el.stroke.width }
            : undefined,
          rectRadius: el.cornerRadius ? pxToInch(el.cornerRadius) : undefined,
          ...(el.shape === 'arrow' ? { lineHead: 'arrow' } : {}),
        }),
      )
      break
    }
    case 'chart': {
      const type = (CHART_TYPE[el.chartType] ?? 'bar') as pptxgen.CHART_NAME
      const data = el.data.series.map((s) => ({
        name: s.name,
        labels: el.data.labels,
        values: s.values,
      }))
      // 데이터 스토리텔링(ADR-011) — 단일 시리즈면 강조 포인트만 accent, 나머지는 흐린 색
      // (PptxGenJS는 시리즈 1개일 때 chartColors를 데이터 포인트별로 적용)
      const hi = el.options.highlightIndex
      const highlightColors =
        hi !== undefined && el.data.series.length === 1
          ? el.data.labels.map((_, i) =>
              i === hi ? resolveColor('token:colors.accent', tokens) : resolveColor('token:colors.border', tokens),
            )
          : undefined
      slide.addChart(
        type,
        data,
        clean<pptxgen.IChartOpts>({
          ...p,
          barDir: el.chartType === 'horizontalBar' ? 'bar' : 'col',
          holeSize: el.chartType === 'donut' ? 50 : undefined,
          showLegend: el.options.showLegend,
          showValue: el.options.showValues,
          chartColors: highlightColors ?? el.options.palette?.map((c) => resolveColor(c, tokens)),
        }),
      )
      break
    }
    case 'table': {
      const rows: pptxgen.TableRow[] = []
      if (el.header) {
        rows.push(
          el.header.map((h) => ({
            text: h,
            options: {
              bold: true,
              color: resolveColor('token:colors.surface', tokens),
              fill: { color: resolveColor('token:colors.primary', tokens) },
            },
          })),
        )
      }
      for (const r of el.rows) {
        rows.push(
          r.map((cell) => ({
            text: cell,
            options: { color: resolveColor('token:colors.textPrimary', tokens) },
          })),
        )
      }
      slide.addTable(rows, {
        ...p,
        fontFace: tokens.fonts.body,
        border: { type: 'solid', pt: 1, color: resolveColor('token:colors.secondary', tokens) },
      })
      break
    }
    case 'image': {
      const isData = el.src.startsWith('data:')
      slide.addImage(
        clean<pptxgen.ImageProps>({
          ...p,
          ...(isData ? { data: el.src } : { path: el.src }),
          sizing: { type: el.fit === 'contain' ? 'contain' : 'cover', w: p.w, h: p.h },
          rounding: !!el.cornerRadius,
          transparency,
        }),
      )
      break
    }
    case 'icon': {
      // 아이콘 전용 렌더는 P8. 현재는 색상 표식으로 대체(무성 소실 금지)
      slide.addText('◆', {
        ...p,
        fontSize: fontSizePt(tokens, undefined, el.frame.h * 0.6),
        color: resolveColor(el.color ?? 'token:colors.primary', tokens),
        align: 'center',
        valign: 'middle',
      })
      break
    }
  }
}

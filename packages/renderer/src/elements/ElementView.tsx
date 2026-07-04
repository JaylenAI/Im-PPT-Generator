import type { CSSProperties } from 'react'
import type { SlideElement } from '@im-ppt/schema'
import { resolveCssColor, fontSizePx, fontFamily, useThemeTokens } from '../theme-context.js'
import { ChartView } from './ChartView.js'

/** 편집 모드 핸들러 — 제공되면 텍스트 인라인 편집 + 요소 선택 활성화 */
export interface EditHandlers {
  selectedId?: string
  onSelect: (id: string) => void
  onEditText: (id: string, content: string) => void
  onEditListItem: (id: string, index: number, text: string) => void
}

/** 요소 frame → 절대 배치 CSS(가상 캔버스 px 그대로) */
function frameStyle(el: SlideElement): CSSProperties {
  return {
    position: 'absolute',
    left: el.frame.x,
    top: el.frame.y,
    width: el.frame.w,
    height: el.frame.h,
    opacity: el.opacity,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
  }
}

const WEIGHT: Record<string, number> = { regular: 400, medium: 500, semibold: 600, bold: 700 }

/** 선택된 요소 강조 아웃라인 */
function selectedOutline(el: SlideElement, edit?: EditHandlers): CSSProperties {
  if (!edit) return {}
  return edit.selectedId === el.id
    ? { outline: '2px solid #6366f1', outlineOffset: 2, borderRadius: 2 }
    : { cursor: 'pointer' }
}

/** 슬라이드 요소 1개를 React로 렌더 — exporter와 같은 캔버스/토큰(웹=PPTX 시각 일치) */
export function ElementView({ el, edit }: { el: SlideElement; edit?: EditHandlers }) {
  const tokens = useThemeTokens()
  const base = { ...frameStyle(el), ...selectedOutline(el, edit) }
  const selectProps = edit
    ? { onClick: (e: React.MouseEvent) => { e.stopPropagation(); edit.onSelect(el.id) } }
    : {}

  switch (el.type) {
    case 'text':
      return (
        <div
          {...selectProps}
          contentEditable={edit ? true : undefined}
          suppressContentEditableWarning={!!edit}
          data-element-id={edit ? el.id : undefined}
          onBlur={edit ? (e) => edit.onEditText(el.id, e.currentTarget.textContent ?? '') : undefined}
          style={{
            ...base,
            fontSize: fontSizePx(tokens, el.role, el.style.fontSize),
            fontFamily: fontFamily(tokens, el.role),
            fontWeight: WEIGHT[el.style.fontWeight ?? 'regular'],
            color: resolveCssColor(el.style.color ?? 'token:colors.textPrimary', tokens),
            textAlign: el.style.align ?? 'left',
            lineHeight: el.style.lineHeight ?? 1.3,
            whiteSpace: 'pre-wrap',
            ...(edit ? { outlineColor: edit.selectedId === el.id ? '#6366f1' : undefined } : {}),
          }}
        >
          {el.content}
        </div>
      )
    case 'list':
      return (
        <ul
          {...selectProps}
          style={{
            ...base,
            margin: 0,
            paddingLeft: 24,
            listStyleType: el.marker === 'number' ? 'decimal' : el.marker === 'dash' ? 'none' : 'disc',
            fontSize: fontSizePx(tokens, undefined, el.style.fontSize),
            fontFamily: tokens.fonts.body,
            color: resolveCssColor(el.style.color ?? 'token:colors.textPrimary', tokens),
            lineHeight: el.style.lineHeight ?? 1.6,
          }}
        >
          {el.items.map((it, i) => (
            <li
              key={i}
              style={{ marginBottom: 4 }}
              contentEditable={edit ? true : undefined}
              suppressContentEditableWarning={!!edit}
              onBlur={edit ? (e) => edit.onEditListItem(el.id, i, e.currentTarget.textContent ?? '') : undefined}
            >
              {!edit && el.marker === 'check' ? `✓ ${it}` : it}
            </li>
          ))}
        </ul>
      )
    case 'shape': {
      const style: CSSProperties = {
        ...base,
        background: el.fill ? resolveCssColor(el.fill, tokens) : 'transparent',
        border: el.stroke
          ? `${el.stroke.width}px solid ${resolveCssColor(el.stroke.color, tokens)}`
          : undefined,
        borderRadius:
          el.shape === 'ellipse' ? '50%' : el.cornerRadius ? el.cornerRadius : undefined,
      }
      if (el.shape === 'line') {
        return (
          <div
            style={{
              ...base,
              height: el.stroke?.width ?? 2,
              background: resolveCssColor(el.stroke?.color ?? el.fill ?? 'token:colors.secondary', tokens),
            }}
          />
        )
      }
      return <div style={style} />
    }
    case 'image':
      return (
        <img
          src={el.src}
          alt={el.alt}
          style={{
            ...base,
            objectFit: el.fit === 'fill' ? 'fill' : el.fit,
            borderRadius: el.cornerRadius,
          }}
        />
      )
    case 'icon':
      // 아이콘 세트 렌더는 P8. 표식으로 대체(무성 소실 금지)
      return (
        <div
          style={{
            ...base,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: el.frame.h * 0.7,
            color: resolveCssColor(el.color ?? 'token:colors.primary', tokens),
          }}
          aria-label={el.name}
        >
          ◆
        </div>
      )
    case 'table':
      return (
        <table
          style={{
            ...base,
            borderCollapse: 'collapse',
            fontFamily: tokens.fonts.body,
            fontSize: fontSizePx(tokens, 'caption', undefined),
          }}
        >
          <tbody>
            {el.header && (
              <tr>
                {el.header.map((h, i) => (
                  <th
                    key={i}
                    style={{
                      background: resolveCssColor('token:colors.primary', tokens),
                      color: resolveCssColor('token:colors.surface', tokens),
                      padding: '6px 10px',
                      textAlign: 'left',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            )}
            {el.rows.map((r, ri) => (
              <tr key={ri}>
                {r.map((c, ci) => (
                  <td
                    key={ci}
                    style={{
                      border: `1px solid ${resolveCssColor('token:colors.secondary', tokens)}`,
                      padding: '6px 10px',
                      color: resolveCssColor('token:colors.textPrimary', tokens),
                    }}
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    case 'chart':
      return (
        <div style={base}>
          <ChartView el={el} tokens={tokens} />
        </div>
      )
  }
}

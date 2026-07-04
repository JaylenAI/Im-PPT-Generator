/**
 * 오버플로 자동수정 — 텍스트가 프레임을 넘치면 폰트 크기를 줄여 맞춘다(PowerPoint의 "넘칠 때 축소").
 * 폰트 메트릭 없이 문자 폭을 근사(한중일=1.0em, 라틴=0.52em)해 결정론적으로 추정.
 * 렌더러(웹 미리보기)와 익스포터가 같은 규칙을 쓰도록 순수 함수로 둔다.
 */

// 한중일(전각) 문자 판별 — 한글/한자/가나/전각기호
const CJK = /[ᄀ-ᇿ぀-ヿ㄰-㆏가-힯一-鿿＀-￯]/

/** 텍스트 폭을 em 단위(폰트 크기 배수)로 근사 */
function widthEm(text: string): number {
  let w = 0
  for (const ch of text) w += CJK.test(ch) ? 1.0 : 0.52
  return w
}

export interface FitOptions {
  text: string
  frameW: number
  frameH: number
  /** 원하는(최대) 폰트 크기 */
  fontSize: number
  lineHeight?: number
  minFontSize?: number
  /** 프레임 안쪽 여백(상하좌우) */
  padding?: number
}

/**
 * 프레임에 들어가는 최대 폰트 크기(≤ fontSize, ≥ minFontSize)를 반환.
 * 넘치지 않으면 원래 fontSize 그대로.
 */
export function fitFontSize({ text, frameW, frameH, fontSize, lineHeight = 1.3, minFontSize = 10, padding = 4 }: FitOptions): number {
  if (!text || frameW <= 0 || frameH <= 0) return fontSize
  const availW = Math.max(1, frameW - padding * 2)
  const availH = Math.max(1, frameH - padding * 2)
  const paras = text.split('\n')

  const fits = (fs: number): boolean => {
    const lineWidthEm = availW / fs
    if (lineWidthEm <= 0) return false
    let lines = 0
    for (const p of paras) lines += Math.max(1, Math.ceil((widthEm(p) || 0.001) / lineWidthEm))
    return lines * fs * lineHeight <= availH
  }

  if (fits(fontSize)) return fontSize
  // 이진 탐색으로 맞는 최대 크기
  let lo = minFontSize
  let hi = fontSize
  let best = minFontSize
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2
    if (fits(mid)) { best = mid; lo = mid } else hi = mid
  }
  return Math.max(minFontSize, Math.floor(best))
}

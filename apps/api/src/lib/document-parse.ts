import mammoth from 'mammoth'

const SUPPORTED = ['docx', 'txt', 'md', 'markdown'] as const

/**
 * 업로드 문서 → 텍스트 추출(P7). DOCX는 mammoth, txt/md는 UTF-8.
 * 추출된 텍스트는 리서치 파이프라인의 user_text 소스로 투입돼 덱이 됨.
 */
export async function parseDocument(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop() ?? ''
  if (ext === 'docx') {
    const { value } = await mammoth.extractRawText({ buffer })
    return value.trim()
  }
  if (ext === 'txt' || ext === 'md' || ext === 'markdown') {
    return buffer.toString('utf8').trim()
  }
  throw new Error(`지원하지 않는 형식: .${ext} (지원: ${SUPPORTED.join('/')})`)
}

export function isSupportedDocument(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop() ?? ''
  return (SUPPORTED as readonly string[]).includes(ext)
}

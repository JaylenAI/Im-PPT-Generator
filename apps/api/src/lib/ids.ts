/** 충돌 안전 ID — 서버 재시작에도 카운터 리셋 PK 충돌 없음(시간+랜덤) */
function rand(): string {
  return Math.random().toString(36).slice(2, 7)
}

export function newJobId(): string {
  return `job_${Date.now().toString(36)}${rand()}`
}

export function newDeckId(): string {
  return `deck_${Date.now().toString(36)}${rand()}`
}

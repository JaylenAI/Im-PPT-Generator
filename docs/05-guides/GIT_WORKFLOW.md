# GIT WORKFLOW — 브랜치/커밋 규칙

## 브랜치 구조 (GitHub Flow)

```
main ──── 릴리스 전용. dev → main 머지는 배포 준비 완료 시에만. 태그(SemVer)
dev ───── 개발 통합. 모든 feature가 여기로 머지
feature/* fix/* refactor/* docs/* chore/* ── dev에서 분기, 일회용(머지 후 즉시 삭제)
hotfix/* ─ main에서 분기 → main+dev 양쪽 머지
```

## 절대 규칙

1. **dev/main 직접 커밋 금지** — 오타 1글자도 브랜치 생성 후
2. push / merge / tag / PR 생성 — **사용자 승인 후에만**
3. 커밋 전 보고 형식: 변경 요약 + 추가/수정/삭제 파일 + 커밋 메시지 초안 → 확인 후 커밋
4. `--no-verify`, `push --force`(main/dev), push된 커밋 amend/rebase, `.env`·시크릿 커밋 — 금지
5. feature → dev는 squash merge 권장, 동시 활성 브랜치 1~2개
6. **QA+사용자 테스트 통과 전 커밋 금지** — phase별 검증 그린이 커밋 전제조건

## 커밋 메시지

```
<prefix>: <제목 — 한국어, 50자 이내, 마침표 없음>

<본문 — 무엇을/왜. 72자 줄바꿈>
```

prefix: `feat` `fix` `hotfix` `refactor` `docs` `chore` `test` `perf`
**Co-Authored-By / AI 참여 표시 절대 금지.**

## Phase ↔ 브랜치 매핑

| Phase | 브랜치 | 머지 조건 |
|---|---|---|
| P0 셋업 | main 최초 커밋 → dev 분기 | 단위+typecheck 그린 |
| P1 | `feature/p1-vertical-slice` | 실 API E2E 관통 + export 육안 QA |
| P2 | `feature/p2-persistence-sse` | SSE 재접속 E2E |
| P3 | `feature/p3-research-citations` | 실 검색 통합 + 인용 역추적 E2E |
| …이후 | ROADMAP의 phase당 1브랜치 | phase별 검증 기준(ROADMAP 참조) |

## 릴리스

- dev → main 머지 + annotated tag: `git tag -a v0.1.0 -m "..."`
- 버전: v0.x.y (MVP=v0.1.0, HITL 완성=v0.5.0, 패리티=v1.0.0)
- 릴리스 노트: 영문+국문(Added/Fixed/Changed)

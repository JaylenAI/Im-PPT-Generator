# TEMPLATE SYSTEM — 템플릿 시스템 설계

> "템플릿을 한곳에 모아 바로 선택 + 새 템플릿 추가/저장해 재사용 + 사용자 PPTX 양식으로 제작"을 어떻게 하드코딩 없이 구현하는가.
> 정본 스키마: `packages/schema/src/template.ts` (`templateMetaSchema`, `customTemplateSchema`). 코드 레지스트리: `packages/templates`.

## 4종 출처 (source)

| source | 테마 소유 | 저장 위치 | 생성 방법 |
|---|---|---|---|
| `builtin` | 코드(`packages/templates/themes`) | 코드 레지스트리 | 개발자가 레이아웃+테마로 제작. `register()` 1줄 추가 |
| `user` | DB(`themeTokens` 인라인) | Postgres `templates` 테이블 | ① 갤러리에서 신규 제작 ② **현재 덱의 스타일을 "템플릿으로 저장"** |
| `imported_pptx` | DB(`themeTokens` 인라인) | Postgres `templates` 테이블 | 사용자 PPTX 업로드 → 마스터/레이아웃/색/폰트 추출(P6) |
| `imported_url` | DB(`themeTokens` 인라인) | Postgres `templates` 테이블 | 브랜드 사이트 URL → 대표 색·폰트 추출해 브랜드 테마 생성(P12, SSRF 방어) |

핵심: **builtin은 코드가 테마를 소유**(레지스트리에서 `getTheme(id)`), **user/imported는 DB가 테마 토큰을 인라인 소유**(`customTemplateSchema.themeTokens`). 갤러리는 이 둘을 **동일한 `templateMetaSchema`로 합쳐서** 노출하므로 UI는 출처를 구분할 필요가 없다(하드코딩 분기 없음).

## 통합 조회 — "한곳에 모아 바로 선택"

```
GET /templates?category=&aspectRatio=&source=
 → builtin(레지스트리) + user/imported(DB, workspace_id 스코프) 를 병합해 TemplateMeta[] 반환
```

`packages/templates`의 `listTemplates()`가 빌트인을, `packages/db`가 사용자 것을 반환하고, API 라우트가 병합한다. 프론트는 한 그리드에 렌더(Stitch `_2` 화면). 필터는 순수 데이터(category/aspectRatio/source) — 새 카테고리 추가해도 코드 수정 없음.

## 템플릿 선택 → 생성

`GenerationConfig.templateId`에 선택한 id가 들어가면, 파이프라인의 "템플릿 선택" 단계가 스킵되고 그 템플릿의 테마+레이아웃 세트로 바로 진행([ADR-003](ADR-003-hitl-3gates.md)). 사용자가 아무것도 안 고르면 AI가 주제/톤에 맞춰 자동 선택.

테마 해석은 출처 무관하게 단일 경로:
```
resolveTheme(templateId):
  builtin  → packages/templates getTheme(themeId)
  user/imported → DB customTemplate.themeTokens
→ 이후 렌더러/익스포터는 동일한 themeTokens만 본다 (token:colors.* resolver 공용)
```

## 새 템플릿 저장 — "다음에 또 사용"

두 경로 모두 `POST /templates`(P6):
1. **덱 스타일 저장**: 현재 덱의 themeId+레이아웃 사용현황 → `customTemplate`로 스냅샷 저장. "이 덱처럼 만들기"를 재사용 가능하게.
2. **갤러리 신규 제작**: 색/폰트를 편집해 새 테마 토큰 구성 → 저장.

저장 시 `workspaceId` 필수(소유자), `source='user'`, 미리보기 이미지는 렌더러로 대표 슬라이드 PNG 생성해 첨부.

## 사용자 PPTX 양식으로 제작 (imported_pptx, P6)

```
POST /templates/import-pptx  (파일 업로드)
 → services/pptx-parser(python-pptx): slide_masters → layouts → placeholders(위치/타입) + 테마 색/폰트 추출
 → 추출 결과를 themeTokens + layoutTypes 매핑으로 정규화
 → customTemplate(source='imported_pptx') 저장 + 추출 미리보기 반환
```
v1 스코프: placeholder 기반 표준 PPTX. 자유 배치 텍스트박스 완전 대응은 연구급(PPTAgent 참고) → 후속. 추출 실패 요소는 "미지원"으로 명시(무성 폴백 금지).

## 브랜드 사이트 URL로 제작 (imported_url, P12)

```
POST /templates/from-url  { url }
 → assertPublicUrl(SSRF 방어: private/loopback/link-local/metadata IP·DNS 검증·리다이렉트 재검증)
 → safeFetchText(HTML) + same-origin 스타일시트 → 색/폰트 추출
   · 색: CSS 변수(--primary/--brand/--accent 가중 40) + theme-color 메타(가중 100, 채도·명도 필터 통과 시)
   · 폰트: Google Fonts 링크 + font-family(HTML+CSS 번들 스캔)
 → mergeBrandKit(base, kit)로 브랜드 테마 토큰 구성 → customTemplate(source='imported_url') 저장
```
색 분류는 채도·명도 필터로 near-white/near-black을 브랜드 색 후보에서 제외(예: Vercel primary=#bd5200, Airbnb 폰트=Airbnb Cereal VF). 추출 실패 시 `400 EXTRACT_FAILED`(무성 폴백 금지).

## 빌트인 테마 라이브러리 (113종, P11.4)

빌트인 테마는 4개 소스 파일에서 모여 `registry.ts`의 `THEME_LIST`로 합류한다. 전부 색+폰트 정체성을 그대로 반입(개인 전용 플랫폼 — 레퍼런스 그대로, 오리지널 "안전 자산" 노선 폐기).

| 소스 파일 | 종수 | 내용 / 출처 |
|---|---|---|
| 오리지널(stitch-indigo, deep-navy, extra, gallery) | 16 | 초기 빌트인 + 갤러리 확장 |
| `themes/packs.ts` | 16 | 스타일팩 — 색+타이포 페어링 오리지널 |
| `themes/design-diversity.ts` | 60 | `epoko77-ai/design-diversity`(MIT) ppt-* 팩 `tokens.json` → Theme 매핑 |
| `themes/design-community.ts` | 21 | reveal.js 14 + Catppuccin 4 + Marp 3 (전부 MIT, 공식 테마 SCSS/팔레트 파싱) |

- 반입 스크립트는 세션 스크래치패드에 있었고(레포 미포함), 산출물 `.ts`만 커밋됨. 재생성이 필요하면 해당 레포를 clone해 `tokens.json`/SCSS를 파싱(색은 hex 검증 — 그라디언트/rgba/none 정제).
- 각 테마가 쓰는 폰트는 `apps/web/index.html`의 Google Fonts + Pretendard CDN으로 로딩(정체성 재현). "Source Sans Pro"→"Source Sans 3" 리네임 매핑.
- 카테고리 매핑: 각 소스의 `*_CATEGORY` 레코드 → 템플릿 메타 생성 시 사용.

## 디자인 시스템 엔진 (20종, P11.5 → P12)

"색만 다르고 골격은 동일" 문제를 해결하는 레이어. 색/폰트를 넘어 **레이아웃 골격**을 시스템 단위로 차별화한다.

```
schema/theme.ts     themeStyleSchema (optional) — system·headingCase·titleAccent·
                    kicker·background·surface·radius·border. 없으면 플랫(하위호환)
themes/design-systems.ts   20 시스템 정의 + classifySystem(키워드 분류·해시 분산 폴백) + withDesignSystem
layouts/decorate.ts        applyDesignSystem — build 결과 후처리:
                             대문자 헤딩 / 타이틀 액센트(bar·sidebar·underline·block) /
                             배경(grid·ruled·gradient·watermark) / 표면 radius·헤어라인
layouts/types.ts           defineLayout이 모든 레이아웃 build를 감싸 decorate 일괄 적용
                             (LayoutContext.style로 주입)
```

- **적용 흐름**: `registry.ts`의 `THEME_LIST.map(withDesignSystem)`이 모든 테마에 `tokens.style`을 붙임(키워드 분류) → build 호출부(sample-deck·core pipeline slide/edit/deck·csv-chart)가 `getTheme(id).tokens.style`을 `layout.build(content, { canvas, style })`로 전달 → `defineLayout`이 `applyDesignSystem`으로 장식.
- **20 시스템**: (P11.5) dark-tech-glow · consulting-grid · editorial-serif · brutalist-block · pastel-card · luxury-keynote · swiss-minimal · glass-gradient · data-infographic · warm-organic · (P12) terminal-mono · poster-bold · cloud-soft · corporate-outline · mono-label · vivid-block · blueprint-tech · gallery-frame · neo-startup · paper-academic.
- **분류 폴백(P12)**: 키워드 미매칭 테마는 `swiss-minimal` 단일 폴백 대신 `themeId` 안정 해시로 7개 풀(swiss/corporate-outline/mono-label/paper-academic/cloud-soft/gallery-frame/neo-startup)에 분산 → 113종이 한 시스템으로 쏠리던 단조로움 해소.
- **새 시스템 추가**: `DESIGN_SYSTEMS` 배열에 1개 + `RULES`에 키워드 매핑 추가. decorate가 이미 모든 스타일 필드를 해석하므로 코드 수정 불필요.
- **한계**: 패밀리 단위(20종) 차별화지 팩별 픽셀 재현은 아님. text 요소에 mono 폰트/letterSpacing이 없어 모노 키커·자간은 미표현(렌더러 확장 시 가능). 배경 grid/ruled는 은은한 opacity(강도 튜닝 여지).

## 확장 규칙 (하드코딩 없음 보장)

- 새 빌트인 테마/레이아웃: `packages/templates` 배열에 1줄 추가 → 갤러리 자동 반영. 새 테마는 `withDesignSystem`이 자동으로 디자인 시스템을 매핑(원하면 `tokens.style` 직접 지정)
- 새 디자인 시스템: `themes/design-systems.ts`의 `DESIGN_SYSTEMS` + `RULES`에 추가 → 전 레이아웃에 자동 적용
- 새 카테고리: `templateCategorySchema` enum에 추가 → 필터 UI 자동 반영(데이터 주도)
- 테마는 항상 토큰(`token:colors.*` 참조)으로만 슬라이드에 연결 → 템플릿 교체가 슬라이드 데이터 수정 없이 전파([ADR-005](ADR-005-virtual-canvas.md))
- 템플릿 로직은 `packages/templates`(빌트인) + `packages/db`(사용자)에만. API/웹은 조회·표시만([ADR-007](ADR-007-api-first-headless.md))

## 관련 API (REST_API.md)

`GET /templates` · `GET /themes` · `POST /templates`(저장) · `POST /templates/import-pptx`(추출) · `POST /brand-kits`

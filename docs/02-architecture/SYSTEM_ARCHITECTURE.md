# Im PPT Generator 아키텍처 개요

## 시스템 구조

```mermaid
flowchart LR
    subgraph 입력
        U[유저 프롬프트/문서/URL/PPTX 템플릿]
    end

    subgraph packages/research
        S[웹서치 어댑터<br/>Tavily/Serper] --> F[팩트 추출<br/>+소스 ID 부착]
    end

    subgraph packages/core
        O[아웃라인 생성] --> PL[슬라이드별 계획]
        PL --> G[슬라이드 JSON 생성<br/>스키마 검증 + 재시도]
    end

    subgraph HITL 게이트
        G1{{"① 팩트 승인"}}
        G2{{"② 아웃라인 승인"}}
        G3{{"③ 계획 승인"}}
    end

    U --> S
    F --> G1 --> O
    O --> G2 --> PL
    PL --> G3 --> G

    G -->|slide_delta SSE| W[apps/web<br/>실시간 렌더/에디터]
    G --> D[(Supabase<br/>packages/db)]
    D --> E[packages/exporter<br/>PPTX/PDF]
```

## 핵심 결정 (ADR 요약)

1. **JSON 스키마 → 듀얼 렌더러** (HTML 자유 렌더 → 사후 변환 방식 기각)
   - 근거: 수동 편집 + 페이지 단위 AI 수정 + 편집 가능한 PPTX export가 동시 성립하는 유일한 구조. Gamma(HTML 방식)의 PPTX export 깨짐이 반면교사.
2. **레이아웃은 코드, 콘텐츠는 AI** — Beautiful.ai/Presenton 방식. LLM 출력은 레이아웃 선택 + 스키마 준수 콘텐츠로 제한.
3. **가상 캔버스 절대좌표(16:9 = 1280×720px)** — 렌더러와 PptxGenJS 익스포터가 같은 좌표계 공유(px → inch 변환만).
4. **의미 단위 SSE 이벤트** (`packages/schema/src/events.ts`) — 토큰 스트림이 아닌 `slide_started/slide_delta/slide_done` 단위. 재접속 시 이벤트 재생 가능하도록 잡 테이블에 영속(P3).
5. **색상은 테마 토큰 참조(`token:colors.primary`) 허용** — 테마 교체 시 전 슬라이드 자동 반영, 하드코딩 방지.

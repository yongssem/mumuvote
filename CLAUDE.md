# 무무보트 (mumuvote) — 학교 선거 앱

## 한 줄 정의
링크 하나로 우리 반/전교 선거를 만들고, 후보 공약을 보며, 태블릿 한 대로 학생들이 순서대로 투표하는 앱.

## 레벨: L3 (실시간 공유 · Firebase · AI 없음)
- 최초 등록자(선생님)가 만든 선거를 다른 기기에서도 4자리 코드로 접속해 참여/결과 수합.
- 순수 투표 앱. AI 호출 없음.

## 기술 스택
- React + Vite (npm)
- Firebase Firestore (실시간 공유·결과 수합)
- 라우팅: react-router-dom
- 스타일: Tailwind CSS
- 폰트: Pretendard 계열
- 배포: (미정) Vercel/Firebase Hosting 중 택1

## 핵심 사용자 흐름
1. **링크 공유** — 선생님이 앱 링크를 공유.
2. **선거 선택/등록** — 링크를 받으면 등록된 선거 목록에서 선택하거나 새로 등록.
   - 선거를 **선택**하려면 그 선거의 **4자리 숫자 코드** 입력 (잠금장치).
   - 새 선거 등록 시: 선거명(예: 삼향초 5학년 대표선거), 4자리 코드, **투표 방식 설정**(순위투표 1·2·3등 / 단순 선택), 후보 등록.
3. **반 입력 + 투표인단 명단** — 우리 반 이름 입력 → 투표할 학생 명단 등록(이름 목록). 순서가 곧 투표 순번.
4. **후보 관찰** — 입후보자 목록 화면. 후보를 클릭하면 공약·포스터 상세 보기.
5. **투표 진행** — "투표시작" 누르면 투표인단이 **순서대로** 화면에 등장 →
   - 순위투표 모드: 1등/2등/3등 후보를 각각 선택.
   - 단순 선택 모드: 후보 1명 선택.
   - 한 명 끝나면 자동으로 다음 투표자 등장.
6. **결과** — 관리자가 집계 결과 확인(득표/순위 점수).

## 화면 위주 = PC/태블릿
- 태블릿·PC 한 대로 학생들이 돌아가며 투표하는 시나리오가 기본.
- 학생이 공약을 보며 투표하므로 **넓은 화면 우선** 레이아웃. 모바일도 깨지지 않게.

## Firestore 데이터 모델 (초안 — 구현 시 조정 가능)
```
elections/{electionId}
  name        : string   // "삼향초 5학년 대표선거"
  code        : string   // "0417" (4자리)
  voteMode    : "ranked" | "single"
  candidates  : [{ id, number, name, slogan, pledges, posterUrl }]
  createdAt    : timestamp

  classes/{classId}
    name    : string   // "5학년 3반"
    voters  : [{ id, name, order, hasVoted }]

    ballots/{ballotId}
      voterId : string
      // ranked: { first, second, third } (후보 id)
      // single: { choice } (후보 id)
      createdAt : timestamp
```
- 코드 접속: `elections`에서 `code` 일치하는 선거 조회.
- 결과 집계: ranked는 1등 3점/2등 2점/3등 1점 등 가중치(구현 시 확정), single은 단순 카운트.

## 랜딩 배경 (필수)
- 히어로 배경: `public/bg-landing.png` (용쌤이 나노바나나로 생성해 투입)
- 파일 없을 때 fallback: 브랜드 색 그라데이션
- 배경 위 가독성 오버레이 1겹 필수 (어두운 그라데이션)
- `bg-cover bg-center`, 모바일/데스크톱 반응형

## 디자인 토큰 (무무보트 · 시빅 톤)
- Primary(인디고): `#4F46E5`
- Accent(앰버/CTA): `#F59E0B`
- 배경: `#F8FAFC` (slate-50)
- 잉크(텍스트): `#0F172A`
- 성공/득표: `#10B981`
- 폰트: Pretendard, Noto Sans KR
- 무드: 깔끔·신뢰감 있는 civic + 학교스러운 친근함, border-radius 16px+

## 푸터 (필수)
© 2026 무궁무진클래스 · 용쌤
- 링크: https://mumuclass.kr
- 색상: #64748b, 12px, 중앙정렬, 24px 하단 패딩

## 코드 컨벤션
- 주석: 한국어
- README.md 자동 생성 금지
- CLAUDE.md 무단 수정 금지
- SPEC.md / DESIGN.md는 필요 시 별도

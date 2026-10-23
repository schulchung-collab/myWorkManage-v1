# 진행 기록

최신 기록이 위에 옵니다.

## 2026-10-23 18:35 — M0 완료: 계획, 프로젝트 생성

- 완료: `docs/PLAN.md` 작성(목표, 범위, 기술 스택, 데이터 모델, 화면, 마일스톤, 결정/가정). create-next-app으로 Next.js 16.4.2 + React 19 + Tailwind v4 + TypeScript 프로젝트 생성. lucide-react, zod, pretendard 설치. git 초기화.
- 확인: Node 24 내장 `node:sqlite`가 추가 설치 없이 동작함(SQLite 3.53.4).
- 참고: Next 16.4 기본 설정인 Cache Components가 켜져 있어, DB 읽기는 `<Suspense>` 안에서 `await io()` 뒤에 하도록 설계함.
- 다음: M1 앱 틀(사이드바, 홈, 업무 관리 탭), 디자인 토큰.
- 막힌 점: 없음.

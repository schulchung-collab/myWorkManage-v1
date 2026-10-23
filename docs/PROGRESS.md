# 진행 기록

최신 기록이 위에 옵니다.

## 2026-10-23 18:45 — M1·M2 완료: 앱 틀, 데이터 계층

- 완료(M1): 디자인 토큰(라이트/다크 CSS 변수), Pretendard 글꼴(로컬 포함), 왼쪽 사이드바(홈, 업무 관리, 뷰어 5종 "예정" 비활성), 다크 모드 전환 버튼, 홈 화면(오늘 요약 + 앱 카드).
- 완료(M2): `node:sqlite` 연결(WAL, 외래키), 스키마 v1(projects, tasks), 처음 실행 시 샘플 프로젝트 3개·업무 17개 자동 입력(날짜는 실행한 주 기준), 리포지토리, REST API(`/api/projects`, `/api/tasks` 및 `[id]`), zod 입력 검증, `npm run db:reset`.
- 확인: `next build` 통과. 서버를 띄워 API로 프로젝트·업무 추가/수정/삭제, 날짜 순서 오류(400), 없는 항목(404), 프로젝트 삭제 시 소속 업무 함께 삭제를 확인함. typecheck·lint 통과.
- 다음: M3 목록 화면 + 프로젝트/업무 편집 창.
- 막힌 점: 없음. (참고: Windows에서 백그라운드 서버를 멈춰도 node 자식 프로세스가 남아 PID로 직접 종료함)

## 2026-10-23 18:35 — M0 완료: 계획, 프로젝트 생성

- 완료: `docs/PLAN.md` 작성(목표, 범위, 기술 스택, 데이터 모델, 화면, 마일스톤, 결정/가정). create-next-app으로 Next.js 16.4.2 + React 19 + Tailwind v4 + TypeScript 프로젝트 생성. lucide-react, zod, pretendard 설치. git 초기화.
- 확인: Node 24 내장 `node:sqlite`가 추가 설치 없이 동작함(SQLite 3.53.4).
- 참고: Next 16.4 기본 설정인 Cache Components가 켜져 있어, DB 읽기는 `<Suspense>` 안에서 `await io()` 뒤에 하도록 설계함.
- 다음: M1 앱 틀(사이드바, 홈, 업무 관리 탭), 디자인 토큰.
- 막힌 점: 없음.

import type { DatabaseSync } from "node:sqlite";
import { addDays, mondayOf, todayLocal } from "@/lib/dates";
import type { TaskPriority, TaskStatus } from "@/lib/tasks/model";

interface SeedTask {
  title: string;
  /** 이번 주 월요일 기준 일수 */
  from: number;
  to: number;
  status: TaskStatus;
  priority?: TaskPriority;
  progress?: number;
  memo?: string;
}

interface SeedProject {
  name: string;
  color: string;
  client: string;
  memo: string;
  tasks: SeedTask[];
}

/**
 * 구조기술사 실무 예시 프로젝트 3개.
 * 날짜는 처음 실행한 날이 속한 주의 월요일을 기준으로 정해서
 * 언제 설치해도 "지금 진행 중인" 모습이 되도록 한다.
 */
const SAMPLE: SeedProject[] = [
  {
    name: "판교 업무시설 신축 구조설계",
    color: "#2563eb",
    client: "OO건설",
    memo: "지하 4층, 지상 15층 철근콘크리트조. 코어벽 + 무량판 슬래브.",
    tasks: [
      { title: "구조계획서 작성", from: -28, to: -15, status: "done", progress: 100 },
      {
        title: "하중 산정 (고정·활하중, 풍·지진하중)",
        from: -18,
        to: -8,
        status: "done",
        progress: 100,
        memo: "KDS 41 12 00 기준. 지진구역 I, 지반종류 S4 가정 — 지반조사 결과 받으면 재확인.",
      },
      {
        title: "MIDAS Gen 해석 모델링",
        from: -9,
        to: 4,
        status: "doing",
        priority: "high",
        progress: 60,
        memo: "코어벽 강성 검토 중. 층간변위 확인 필요.",
      },
      { title: "부재 설계 (보·기둥·슬래브)", from: 2, to: 18, status: "todo" },
      { title: "기초 설계 및 지반 검토", from: 12, to: 24, status: "todo" },
      { title: "구조계산서 작성·제출", from: 22, to: 33, status: "todo", priority: "high" },
      { title: "구조도면 검토", from: 28, to: 40, status: "todo", priority: "low" },
    ],
  },
  {
    name: "성남 OO아파트 정밀안전진단",
    color: "#c2410c",
    client: "OO아파트 관리사무소",
    memo: "1994년 준공, 15층 5개동. 정밀안전진단 (2종).",
    tasks: [
      { title: "자료 수집 및 설계도서 검토", from: -21, to: -14, status: "done", progress: 100 },
      {
        title: "현장 외관조사 (균열·누수·박리)",
        from: -12,
        to: -7,
        status: "done",
        progress: 100,
        memo: "지하주차장 상부 슬래브 균열 다수. 사진 정리 완료.",
      },
      {
        title: "비파괴시험 (반발경도·탄산화·철근탐사)",
        from: -4,
        to: 3,
        status: "doing",
        progress: 40,
      },
      { title: "구조해석 및 내하력 평가", from: 4, to: 17, status: "todo" },
      { title: "안전성 평가 및 보수·보강 방안", from: 15, to: 25, status: "todo" },
      {
        title: "최종 보고서 납품",
        from: 29,
        to: 29,
        status: "todo",
        priority: "high",
        memo: "인쇄본 5부 + 전자파일. 시설물통합정보관리시스템(FMS) 등록.",
      },
    ],
  },
  {
    name: "물류센터 증축 구조검토",
    color: "#15803d",
    client: "OO물류",
    memo: "기존 PEB 창고 2층 증축 및 지붕 태양광 설치 검토.",
    tasks: [
      {
        title: "기존 구조도면·계산서 검토",
        from: -2,
        to: 6,
        status: "doing",
        progress: 30,
      },
      { title: "증축 하중 및 지붕 태양광 하중 검토", from: 7, to: 14, status: "todo" },
      { title: "보강 방안 검토 (철골 보강)", from: 14, to: 23, status: "todo" },
      { title: "구조검토 의견서 작성", from: 24, to: 30, status: "todo", priority: "high" },
    ],
  },
];

export function seedSampleData(db: DatabaseSync, today: string = todayLocal()) {
  const base = mondayOf(today);
  const now = new Date().toISOString();
  const insertProject = db.prepare(
    `INSERT INTO projects (name, color, client, memo, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertTask = db.prepare(
    `INSERT INTO tasks (project_id, title, start_date, due_date, status, priority, progress, memo, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  SAMPLE.forEach((p, pi) => {
    const result = insertProject.run(p.name, p.color, p.client, p.memo, pi + 1, now, now);
    const projectId = Number(result.lastInsertRowid);
    p.tasks.forEach((t, ti) => {
      insertTask.run(
        projectId,
        t.title,
        addDays(base, t.from),
        addDays(base, t.to),
        t.status,
        t.priority ?? "normal",
        t.progress ?? 0,
        t.memo ?? null,
        ti + 1,
        now,
        now,
      );
    });
  });
}

import { io } from "next/cache";
import { todayLocal } from "@/lib/dates";
import { listProjects, listTasks } from "./repo";

/**
 * 화면용 데이터 읽기.
 * node:sqlite 는 동기 드라이버라서, Cache Components 환경에서는 읽기 전에
 * io() 로 "요청 시점 데이터"임을 알려야 빌드 때 정적으로 굳지 않는다.
 */
export async function loadBoard() {
  await io();
  return {
    projects: listProjects(),
    tasks: listTasks(),
    today: todayLocal(),
  };
}

export async function loadProjects() {
  await io();
  return { projects: listProjects(), today: todayLocal() };
}

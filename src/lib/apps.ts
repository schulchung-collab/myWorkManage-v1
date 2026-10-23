/**
 * 사이트에 들어가는 앱 목록. 사이드바와 홈 화면이 함께 쓴다.
 * 새 앱을 추가할 때는 여기에 한 줄을 넣고 status 를 "active" 로 바꾼다.
 */
export type AppStatus = "active" | "planned";

export type AppIconName = "tasks" | "model3d" | "cad2d" | "fem" | "pdf" | "ppt";

export interface SiteApp {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: AppIconName;
  status: AppStatus;
  group: "work" | "viewer";
}

export const SITE_APPS: SiteApp[] = [
  {
    id: "tasks",
    name: "업무 관리",
    description: "프로젝트별 업무를 목록, 월별 달력, 간트차트로 관리합니다.",
    href: "/tasks/list",
    icon: "tasks",
    status: "active",
    group: "work",
  },
  {
    id: "model3d",
    name: "3D 모델 뷰어",
    description: "구조 모델을 브라우저에서 돌려 봅니다.",
    href: "#",
    icon: "model3d",
    status: "planned",
    group: "viewer",
  },
  {
    id: "cad2d",
    name: "2D CAD 뷰어",
    description: "DXF 등 도면 파일을 설치 없이 엽니다.",
    href: "#",
    icon: "cad2d",
    status: "planned",
    group: "viewer",
  },
  {
    id: "fem",
    name: "구조해석 FEM 뷰어",
    description: "해석 결과(변위, 부재력)를 시각화합니다.",
    href: "#",
    icon: "fem",
    status: "planned",
    group: "viewer",
  },
  {
    id: "pdf",
    name: "문서(PDF) 뷰어",
    description: "계산서, 보고서 PDF를 봅니다.",
    href: "#",
    icon: "pdf",
    status: "planned",
    group: "viewer",
  },
  {
    id: "ppt",
    name: "PPT 뷰어",
    description: "발표 자료를 슬라이드로 봅니다.",
    href: "#",
    icon: "ppt",
    status: "planned",
    group: "viewer",
  },
];

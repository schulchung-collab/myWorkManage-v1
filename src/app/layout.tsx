import type { Metadata } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { Sidebar } from "@/components/shell/sidebar";
import { themeInitScript } from "@/components/shell/theme-toggle";

export const metadata: Metadata = {
  title: {
    default: "내 작업실",
    template: "%s · 내 작업실",
  },
  description: "개인 업무 관리와 엔지니어링 뷰어를 모은 개인 웹사이트",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <div className="flex min-h-dvh">
          <Sidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}

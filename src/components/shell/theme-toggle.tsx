"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function isDark() {
  return document.documentElement.classList.contains("dark");
}

/** 라이트/다크 전환. 선택은 브라우저(localStorage)에 기억한다. */
export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  function toggle() {
    const next = !isDark();
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // 저장소를 쓸 수 없어도 전환 자체는 동작한다
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-side-muted transition-colors duration-150 hover:bg-side-hover hover:text-side-fg"
      aria-label={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      {dark ? <Sun className="size-4 shrink-0" aria-hidden /> : <Moon className="size-4 shrink-0" aria-hidden />}
      <span className="hidden md:inline">{dark ? "라이트 모드" : "다크 모드"}</span>
    </button>
  );
}

/** 첫 화면이 그려지기 전에 저장된 테마를 적용하는 인라인 스크립트 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="dark"){document.documentElement.classList.add("dark")}}catch(e){}})();`;

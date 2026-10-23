import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANT: Record<Variant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover",
  secondary: "border border-line-strong bg-surface text-fg hover:bg-hover",
  ghost: "text-fg-muted hover:bg-hover hover:text-fg",
  danger: "bg-danger text-white hover:bg-danger-hover",
};

const SIZE: Record<Size, string> = {
  sm: "h-8 gap-1.5 px-2.5 text-[13px]",
  md: "h-9 gap-2 px-3.5 text-sm",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", extra = "") {
  return `inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT[variant]} ${SIZE[size]} ${extra}`;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", className = "", type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...props} />;
});

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  size?: "sm" | "md";
  tone?: "default" | "danger";
};

/** 아이콘만 있는 버튼. label 은 스크린리더용 이름과 툴팁으로 쓰인다. */
export function IconButton({
  label,
  size = "md",
  tone = "default",
  className = "",
  type = "button",
  children,
  ...props
}: IconButtonProps) {
  const dim = size === "sm" ? "size-7" : "size-8";
  const color =
    tone === "danger"
      ? "text-fg-subtle hover:bg-danger-soft hover:text-danger"
      : "text-fg-subtle hover:bg-hover hover:text-fg";
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-grid ${dim} shrink-0 cursor-pointer place-items-center rounded-md transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${color} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="ml-1 hidden rounded border border-white/30 px-1 font-sans text-[11px] leading-4 opacity-80 sm:inline">
      {children}
    </kbd>
  );
}

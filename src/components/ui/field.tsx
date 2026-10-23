export const inputClass =
  "h-9 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-fg placeholder:text-fg-subtle transition-colors duration-150 hover:border-fg-subtle focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring/40 aria-invalid:border-danger";

export const textareaClass =
  "w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm leading-relaxed text-fg placeholder:text-fg-subtle transition-colors duration-150 hover:border-fg-subtle focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring/40";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className = "",
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-fg-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

/** 라디오 그룹을 버튼 모양으로 보여주는 세그먼트 컨트롤 */
export function Segmented<T extends string>({
  name,
  value,
  options,
  onChange,
  label,
}: {
  name: string;
  value: T;
  options: { value: T; label: React.ReactNode }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-full rounded-md border border-line-strong bg-subtle p-0.5">
      {options.map((o) => {
        const checked = o.value === value;
        return (
          <label
            key={o.value}
            className={`flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[5px] px-2 text-[13px] transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring ${
              checked ? "bg-surface font-medium text-fg shadow-sm" : "text-fg-muted hover:text-fg"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={checked}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        );
      })}
    </div>
  );
}

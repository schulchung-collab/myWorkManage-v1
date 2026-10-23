export function ViewSkeleton() {
  return (
    <div className="p-5 md:p-6" aria-busy="true" aria-label="불러오는 중">
      <div className="mb-4 h-9 w-72 animate-pulse rounded-md bg-subtle" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}

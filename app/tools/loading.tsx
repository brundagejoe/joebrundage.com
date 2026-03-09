export default function ToolsLoading() {
  return (
    <div className="min-h-screen bg-background pt-16" aria-busy="true">
      <section className="mx-auto max-w-4xl px-6 py-8">
        <div className="max-w-4xl border border-border bg-card">
          <div className="border-b border-border px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Loading tool
          </div>
          <div className="space-y-4 px-4 py-5">
            <div className="h-7 w-56 animate-pulse bg-muted" />
            <div className="h-4 w-full max-w-2xl animate-pulse bg-muted" />
            <div className="h-4 w-full max-w-xl animate-pulse bg-muted" />
            <div className="mt-6 grid gap-3">
              <div className="h-11 w-full animate-pulse border border-border bg-background/50" />
              <div className="h-11 w-full animate-pulse border border-border bg-background/50" />
              <div className="h-11 w-32 animate-pulse border border-border bg-background/50" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

const TECH_STACK = [
  'Next.js App Router',
  'TypeScript',
  'Supabase (PostgreSQL)',
  'Prisma 7',
  'Redux Toolkit',
  'TanStack Query v5',
  'DeckGL / MapLibre',
  'Tailwind CSS',
] as const;

export function OpenSource() {
  return (
    <section className="px-5 py-12 max-w-3xl mx-auto">
      <h2 className="section-title mb-6">Fully open source</h2>

      <div className="flex flex-col gap-4">
        <p className="text-sm text-[var(--t2)] leading-relaxed">
          AdeloopEye is a comprehensive open-source OSINT platform developed by Adeloop AI Lab.
          The entire codebase includes dashboard, API routes, data pipelines,
          and AI intelligence generation. Licensed under AGPL-3.0.
        </p>

        <div className="mt-4">
          <p className="label mb-3">Tech stack</p>
          <div className="flex flex-wrap gap-2">
            {TECH_STACK.map((tech) => (
              <span
                key={tech}
                className="mono text-[length:var(--text-body-sm)] px-2 py-1 border border-[var(--bd-s)] text-[var(--t2)]"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

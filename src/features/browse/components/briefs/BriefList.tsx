import Link from 'next/link';

import { EscalationBar } from '@/features/browse/components/briefs/EscalationBar';

type BriefItem = {
  id: string;
  day: string;
  dayLabel: string;
  summary: string;
  escalation: number;
  keyFacts: string[];
};

type Props = {
  briefs: BriefItem[];
};

export function BriefList({ briefs }: Props) {
  if (briefs.length === 0) {
    return (
      <div className="mt-2 border border-dashed border-[var(--bd)] p-8 text-center">
        <p className="label text-[var(--t3)] mb-2">No briefs yet</p>
        <p className="text-xs text-[var(--t4)] leading-relaxed">
          Daily briefs are generated from real-time reporting. Check back shortly —
          a new brief is compiled each day.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {briefs.map((brief) => (
        <Link
          key={brief.id}
          href={`/browse/brief/${brief.day}`}
          className="no-underline block group"
        >
          <article className="py-6 border-b border-[var(--bd-s)]">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-sm font-semibold text-[var(--t1)] group-hover:text-[var(--blue)] transition-colors">
                {brief.dayLabel}
              </h2>
              <span className="mono text-[length:var(--text-label)] text-[var(--t4)]">{brief.day}</span>
              <span className="mono text-[length:var(--text-label)] text-[var(--t4)]">
                {brief.keyFacts.length} key facts
              </span>
            </div>

            <div className="mb-3 max-w-xs">
              <EscalationBar escalation={brief.escalation} />
            </div>

            <p className="text-[length:var(--text-body)] text-[var(--t2)] leading-relaxed line-clamp-2">
              {brief.summary}
            </p>
          </article>
        </Link>
      ))}
    </div>
  );
}

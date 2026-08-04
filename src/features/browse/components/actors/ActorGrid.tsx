import type { ActivityLevel, Stance } from '@/types/domain';

import { ActorCard } from './ActorCard';

type ActorItem = {
  id: string;
  name: string;
  fullName: string;
  countryCode: string | null;
  type: string;
  affiliation: string | null;
  activityLevel: ActivityLevel;
  activityScore: number;
  stance: Stance;
  saying: string;
  assessment: string;
};

type Props = {
  actors: ActorItem[];
};

export function ActorGrid({ actors }: Props) {
  if (actors.length === 0) {
    return (
      <div className="border border-dashed border-[var(--bd)] p-8 text-center">
        <p className="label text-[var(--t3)] mb-2">No actors found</p>
        <p className="text-xs text-[var(--t4)] leading-relaxed">
          Actor profiles are derived from live reporting. Clear the filters or check back
          shortly — profiles update as new coverage arrives.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {actors.map((actor) => (
        <ActorCard key={actor.id} {...actor} />
      ))}
    </div>
  );
}

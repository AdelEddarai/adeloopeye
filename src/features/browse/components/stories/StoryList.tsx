import { StoryCard } from './StoryCard';

type StoryItem = {
  id: string;
  title: string;
  tagline: string;
  category: string;
  narrative: string;
  keyFacts: string[];
  timestamp: string;
  eventCount: number;
};

type Props = {
  stories: StoryItem[];
};

export function StoryList({ stories }: Props) {
  if (stories.length === 0) {
    return (
      <div className="border border-dashed border-[var(--bd)] p-8 text-center">
        <p className="label text-[var(--t3)] mb-2">No narratives yet</p>
        <p className="text-xs text-[var(--t4)] leading-relaxed">
          Narratives are assembled from real-time reporting. Check back shortly as new
          coverage is analyzed.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {stories.map((story) => (
        <StoryCard key={story.id} {...story} />
      ))}
    </div>
  );
}

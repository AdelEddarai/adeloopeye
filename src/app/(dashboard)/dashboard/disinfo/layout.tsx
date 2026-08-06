import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disinformation Intel',
};

export default function DisinfoLayout({ children }: { children: React.ReactNode }) {
  return children;
}

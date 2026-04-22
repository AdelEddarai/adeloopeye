import { Metadata } from 'next';
import MoroccoMapClient from '@/components/morocco/MoroccoMapClient';

export const metadata: Metadata = {
  title: 'Morocco 4D Map',
  description: 'Interactive 3D map of Morocco with live OSINT intelligence',
};

export default function MoroccoMapPage() {
  return <MoroccoMapClient />;
}

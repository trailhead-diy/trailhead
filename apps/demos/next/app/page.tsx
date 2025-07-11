import { HomePage as DemoHomePage } from '@/components/demo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home | Trailhead UI',
  description: 'Trailhead UI Next.js Demo',
};

export default function HomePage(): React.JSX.Element {
  return <DemoHomePage />;
}

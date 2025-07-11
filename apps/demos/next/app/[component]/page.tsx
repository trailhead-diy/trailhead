import { notFound } from 'next/navigation';
import { pages, routeToPageMap } from '@/components/demo';

interface ComponentPageProps {
  params: Promise<{ component: string }>;
}

export default async function ComponentPage({ params }: ComponentPageProps) {
  const { component } = await params;
  const pageName = routeToPageMap[component as keyof typeof routeToPageMap];
  const PageComponent = pageName ? pages[pageName] : undefined;

  if (!PageComponent) {
    notFound();
  }

  return <PageComponent />;
}

// Generate static params for all available components
export async function generateStaticParams() {
  return Object.keys(routeToPageMap).map(component => ({ component }));
}

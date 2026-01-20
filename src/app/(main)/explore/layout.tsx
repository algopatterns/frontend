import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore | Algopatterns',
  description: 'Discover and fork live coding patterns created by the Algopatterns community. Find inspiration for your next musical creation.',
  openGraph: {
    title: 'Explore | Algopatterns',
    description: 'Discover and fork live coding patterns created by the Algopatterns community.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Explore | Algopatterns',
    description: 'Discover and fork live coding patterns created by the Algopatterns community.',
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

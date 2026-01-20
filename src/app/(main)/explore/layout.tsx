import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore | Algojams',
  description: 'Discover and fork live coding patterns created by the Algojams community. Find inspiration for your next musical creation.',
  openGraph: {
    title: 'Explore | Algojams',
    description: 'Discover and fork live coding patterns created by the Algojams community.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Explore | Algojams',
    description: 'Discover and fork live coding patterns created by the Algojams community.',
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

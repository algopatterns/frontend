import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jams | Algopatterns',
  description: 'Join live coding sessions and create music together in real-time. Experience collaborative algopatterns performances.',
  openGraph: {
    title: 'Jams | Algopatterns',
    description: 'Join live coding sessions and create music together in real-time.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Jams | Algopatterns',
    description: 'Join live coding sessions and create music together in real-time.',
  },
};

export default function JamsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

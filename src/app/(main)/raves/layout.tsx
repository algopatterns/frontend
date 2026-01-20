import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Raves | Algojams',
  description: 'Join live coding sessions and create music together in real-time. Experience collaborative algojams performances.',
  openGraph: {
    title: 'Raves | Algojams',
    description: 'Join live coding sessions and create music together in real-time.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Raves | Algojams',
    description: 'Join live coding sessions and create music together in real-time.',
  },
};

export default function RavesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

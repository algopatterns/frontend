'use client';

const userColors = [
  'text-rose-400',
  'text-amber-400',
  'text-lime-400',
  'text-teal-400',
  'text-sky-400',
  'text-indigo-400',
  'text-fuchsia-400',
  'text-orange-400',
];

export function getUserColor(name: string): string {
  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return userColors[Math.abs(hash) % userColors.length];
}

export function formatTimestamp(timestamp: number | string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

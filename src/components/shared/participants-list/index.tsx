'use client';

import { Crown, Pencil } from 'lucide-react';
import { useParticipantsList } from './hooks';
import { getUserColor } from '../chat-message/hooks';

const colorMap: Record<string, string> = {
  'text-rose-400': 'bg-rose-400',
  'text-amber-400': 'bg-amber-400',
  'text-lime-400': 'bg-lime-400',
  'text-teal-400': 'bg-teal-400',
  'text-sky-400': 'bg-sky-400',
  'text-indigo-400': 'bg-indigo-400',
  'text-fuchsia-400': 'bg-fuchsia-400',
  'text-orange-400': 'bg-orange-400',
};

function getParticipantColor(displayName: string): string {
  const textColor = getUserColor(displayName);
  return colorMap[textColor] || 'bg-gray-400';
}

export function ParticipantsList() {
  const { participants } = useParticipantsList();

  if (participants.length === 0) {
    return null;
  }

  return (
    <div className="p-3 border-b">
      <h3 className="text-xs font-medium text-muted-foreground mb-2">
        Participants ({participants.length})
      </h3>
      <div className="flex flex-wrap gap-2">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-1.5 text-xs bg-secondary rounded-full px-2 py-1"
          >
            <span className={`h-2 w-2 rounded-full ${getParticipantColor(p.displayName)}`} />
            <span>{p.role === 'host' ? p.displayName.split(' ')[0] : p.displayName}</span>
            {p.role === 'host' && (
              <Crown className="h-3 w-3 text-muted-foreground" />
            )}
            {p.role === 'co-author' && (
              <Pencil className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

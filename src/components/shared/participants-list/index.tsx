'use client';

import { Crown, Pencil } from 'lucide-react';
import { useParticipantsList } from './hooks';
import { getUserColor } from '../chat-message/hooks';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useWebSocketStore } from '@/lib/stores/websocket';

const MAX_VISIBLE = 3;

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

interface Participant {
  id: string;
  displayName: string;
  role: string;
}

function ParticipantChip({ participant, isYou }: { participant: Participant; isYou: boolean }) {
  const { displayName, role } = participant;
  const label = isYou ? 'You' : displayName.split(' ')[0];
  return (
    <div className="flex items-center gap-1.5 text-xs bg-secondary rounded-full px-2 py-1">
      <span className={`h-2 w-2 rounded-full ${getParticipantColor(displayName)}`} />
      <span>{label}</span>
      {role === 'host' && <Crown className="h-3 w-3 text-muted-foreground" />}
      {role === 'co-author' && <Pencil className="h-3 w-3 text-muted-foreground" />}
    </div>
  );
}

export function ParticipantsList() {
  const { participants } = useParticipantsList();
  const myDisplayName = useWebSocketStore(state => state.myDisplayName);

  if (participants.length === 0) {
    return null;
  }

  const visibleParticipants = participants.slice(0, MAX_VISIBLE);
  const hiddenCount = participants.length - MAX_VISIBLE;

  return (
    <div className="p-3 border-b">
      <div className="flex items-center gap-2 flex-wrap">
        {visibleParticipants.map((p) => (
          <ParticipantChip key={p.id} participant={p} isYou={p.displayName === myDisplayName} />
        ))}
        {hiddenCount > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-xs bg-secondary hover:bg-secondary/80 rounded-full px-2 py-1 transition-colors">
                +{hiddenCount}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-2 max-h-64 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                {participants.map((p) => (
                  <ParticipantChip key={p.id} participant={p} isYou={p.displayName === myDisplayName} />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}

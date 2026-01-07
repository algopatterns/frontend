'use client';

import { useParticipantsList } from './hooks';

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
            <span
              className={`h-2 w-2 rounded-full ${
                p.role === 'host'
                  ? 'bg-yellow-500'
                  : p.role === 'co-author'
                    ? 'bg-green-500'
                    : 'bg-gray-500'
              }`}
            />
            <span>{p.displayName}</span>
            <span className="text-muted-foreground">({p.role})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

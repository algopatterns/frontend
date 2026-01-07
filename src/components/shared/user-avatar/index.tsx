'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/lib/api/auth/types';
import { sizeClasses, getInitials } from './hooks';

interface UserAvatarProps {
  user: User | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const initials = getInitials(user);

  return (
    <Avatar className={`${sizeClasses[size]} ${className || ''}`}>
      <AvatarImage src={user?.avatar_url} alt={user?.name || 'User'} />
      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

'use client';

import { User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/lib/api/auth/types';
import { sizeClasses, getInitials, iconSizeClasses } from './hooks';

interface UserAvatarProps {
  user: User | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const initials = getInitials(user);
  const isAnonymous = !user;

  return (
    <Avatar className={`${sizeClasses[size]} ${className || ''}`}>
      {!isAnonymous && <AvatarImage src={user?.avatar_url} alt={user?.name || 'User'} />}
      <AvatarFallback className={isAnonymous ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground text-xs'}>
        {isAnonymous ? (
          <UserIcon className={iconSizeClasses[size]} />
        ) : (
          initials
        )}
      </AvatarFallback>
    </Avatar>
  );
}

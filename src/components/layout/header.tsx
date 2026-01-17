'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Moon, Sun, FileText, Settings, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/shared/user-avatar';
import { useAuth } from '@/lib/hooks/use-auth';
import { useUIStore } from '@/lib/stores/ui';

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const {
    setLoginModalOpen,
    setLogoutDialogOpen,
    setDraftsModalOpen,
    setSettingsModalOpen,
  } = useUIStore();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          /||\ <span className='sm:inline-block hidden'>ALGORAVE</span>
        </Link>

        <nav className="ml-6 flex items-center gap-4 text-sm">
          {isAuthenticated && (
            <Link
              href="/shelf"
              className="text-muted-foreground hover:text-foreground transition-colors">
              Shelf
            </Link>
          )}

          <Link
            href="/explore"
            className="text-muted-foreground hover:text-foreground transition-colors">
            Explore
          </Link>

          <Link
            href="/raves"
            className="text-muted-foreground hover:text-foreground transition-colors">
            Raves
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-8 w-8 hidden">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <UserAvatar user={user} size="sm" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              {isAuthenticated ? (
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-muted-foreground">Anonymous</p>
                    <p className="text-xs text-muted-foreground">
                      Sign in to save your work
                    </p>
                  </div>
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDraftsModalOpen(true)}
                className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                Drafts
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSettingsModalOpen(true)}
                className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isAuthenticated ? (
                <DropdownMenuItem
                  onClick={() => setLogoutDialogOpen(true)}
                  className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => setLoginModalOpen(true)}
                  className="cursor-pointer text-emerald-500 focus:text-emerald-500">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

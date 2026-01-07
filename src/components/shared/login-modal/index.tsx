'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoginButtons } from '../login-buttons';
import { useLoginModal } from './hooks';

export function LoginModal() {
  const { isLoginModalOpen, setLoginModalOpen } = useLoginModal();

  return (
    <Dialog open={isLoginModalOpen} onOpenChange={setLoginModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to Algorave</DialogTitle>
          <DialogDescription>
            Sign in to save your strudels, join live sessions, and more.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <LoginButtons />
        </div>
        <div className="text-center text-sm text-muted-foreground">
          Or{' '}
          <button
            type="button"
            onClick={() => setLoginModalOpen(false)}
            className="underline hover:text-foreground transition-colors"
          >
            continue as guest
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

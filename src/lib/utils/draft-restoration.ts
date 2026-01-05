import type { Draft } from './storage';

export interface DraftRestorationContext {
  hasToken: boolean;
  currentStrudelId: string | null;
  latestDraft: Draft | null;
  currentDraft: Draft | null;
  initialLoadComplete: boolean;
}

/**
 * Determines whether to restore from localStorage draft vs server code.
 *
 * Decision matrix:
 * - Anonymous user: ALWAYS restore from localStorage draft (server code ignored)
 * - Auth user without strudelId: restore from localStorage draft
 * - Auth user with strudelId: use server code (localStorage is just backup)
 * - Reconnects (initialLoadComplete=true): never restore, use server state
 */
export function shouldRestoreFromDraft(ctx: DraftRestorationContext): boolean {
  const { hasToken, currentStrudelId, latestDraft, currentDraft, initialLoadComplete } = ctx;

  // never restore on reconnects - server state is authoritative after initial load
  if (initialLoadComplete) {
    return false;
  }

  // anonymous user with any draft: restore from localStorage
  const isAnonymousWithDraft = !hasToken && latestDraft !== null;

  // auth user without a saved strudel open: restore from draft
  const isAuthWithUnsavedDraft =
    hasToken && !currentStrudelId && (currentDraft !== null || latestDraft !== null);

  return isAnonymousWithDraft || isAuthWithUnsavedDraft;
}

/**
 * Picks the appropriate draft to restore.
 *
 * Priority for all users: prefer currentDraft (same tab) over latestDraft (cross-tab).
 * This ensures forked drafts are restored correctly on refresh.
 */
export function pickDraftToRestore(ctx: {
  latestDraft: Draft | null;
  currentDraft: Draft | null;
}): Draft | null {
  const { latestDraft, currentDraft } = ctx;

  // prefer current tab's draft, fallback to latest
  return currentDraft || latestDraft;
}

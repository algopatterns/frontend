import type { Draft } from '@/lib/utils/storage';
import type { SessionStatePayload } from './types';

/**
 * session state machine
 *
 * handles the complex decision logic for what to do when session_state arrives.
 * uses explicit states and actions to prevent race conditions and make debugging easier.
 * 
 * please do not edit without understanding technicalities @agent and @contributors i beg y'all, it took a few hours.
 */

// context available when making decisions
export interface SessionStateContext {
  // auth state
  hasToken: boolean;

  // current editing context (from Zustand/sessionStorage)
  currentStrudelId: string | null;
  currentDraftId: string | null;

  // available drafts (from localStorage)
  latestDraft: Draft | null;
  currentDraft: Draft | null;  // Draft matching currentDraftId

  // session state
  initialLoadComplete: boolean;
  skipCodeRestoration: boolean;

  // request correlation (deprecated - kept for compatibility)
  requestId: string | null;
  currentSwitchRequestId: string | null;

  // server payload
  payload: SessionStatePayload;
  serverCode: string | null;  // payload.code
  defaultCode: string;
}

// explicit actions that can result from processing session_state
export type SessionStateAction =
  | { type: 'RESTORE_DRAFT'; draft: Draft; reason: string }
  | { type: 'USE_SERVER_CODE'; code: string; reason: string }
  | { type: 'USE_DEFAULT_CODE'; code: string; reason: string }
  | { type: 'SKIP_CODE_UPDATE'; reason: string };

// whether to save draft after processing
export type DraftSaveDecision =
  | { shouldSave: false; reason: string }
  | { shouldSave: true; draftId: string; code: string; reason: string };

export interface SessionStateDecision {
  codeAction: SessionStateAction;
  draftSave: DraftSaveDecision;
  debug: {
    context: Partial<SessionStateContext>;
    timestamp: number;
  };
}

/**
 * determines what action to take when session_state is received.
 *
 * decision matrix:
 * 1. skipCodeRestoration=true → skip (e.g., forking, starting new)
 * 2. not initial load → skip (reconnect/stale)
 * 3. live session (has participants) → use server code (single source of truth)
 * 4. solo anonymous with draft → restore from draft
 * 5. solo auth without strudel, with draft → restore from draft
 * 6. auth with strudel → use server code (strudel is authoritative)
 * 7. server has code → use server code
 * 8. fallback to default → use default code
 */
export function decideCodeAction(ctx: SessionStateContext): SessionStateAction {
  const {
    hasToken,
    currentStrudelId,
    latestDraft,
    currentDraft,
    initialLoadComplete,
    skipCodeRestoration,
    payload,
    serverCode,
    defaultCode,
  } = ctx;

  // 1. explicit skip requested (e.g., forking, starting new)
  if (skipCodeRestoration) {
    return { type: 'SKIP_CODE_UPDATE', reason: 'skipCodeRestoration flag set' };
  }

  // 2. only process session_state on initial load (skip on reconnect)
  if (initialLoadComplete) {
    return {
      type: 'SKIP_CODE_UPDATE',
      reason: 'reconnect - initial load already complete'
    };
  }

  // 3. live session detection - server is single source of truth when collaborating
  // this prevents localStorage from interfering with collaborative sessions
  // a session is "live" if: you're not the host (joined someone's session) OR there are other participants
  const isLiveSession =
    payload.your_role !== 'host' ||
    (payload.participants && payload.participants.length > 1);

  if (isLiveSession) {
    // in live sessions, always use server code - it's authoritative
    if (serverCode) {
      return {
        type: 'USE_SERVER_CODE',
        code: serverCode,
        reason: `live session with ${payload.participants.length} participant(s) - server is authoritative`
      };
    }
    // live session but no server code (shouldn't happen, but fallback)
    return {
      type: 'USE_DEFAULT_CODE',
      code: defaultCode,
      reason: 'live session but no server code'
    };
  }

  // from here on, we know it's a solo session (no other participants)

  // 4. solo anonymous user with draft → restore from draft
  // prefer currentDraft (same tab) over latestDraft (cross-tab) to handle forks correctly
  if (!hasToken) {
    const draftToRestore = currentDraft || latestDraft;
    if (draftToRestore) {
      return {
        type: 'RESTORE_DRAFT',
        draft: draftToRestore,
        reason: `solo anonymous user with draft (${currentDraft ? 'currentDraft' : 'latestDraft'})`
      };
    }
  }

  // 5. solo auth user without strudel, with draft → restore from draft
  // prefer currentDraft (same tab) over latestDraft (cross-tab)
  if (hasToken && !currentStrudelId) {
    const draftToRestore = currentDraft || latestDraft;
    if (draftToRestore) {
      return {
        type: 'RESTORE_DRAFT',
        draft: draftToRestore,
        reason: `solo auth user with unsaved draft (${currentDraft ? 'currentDraft' : 'latestDraft'})`
      };
    }
  }

  // 6. auth user with strudel → use server code (strudel is authoritative)
  if (hasToken && currentStrudelId && serverCode) {
    return {
      type: 'USE_SERVER_CODE',
      code: serverCode,
      reason: 'auth user editing saved strudel'
    };
  }

  // 7. server has code → use it
  if (serverCode) {
    return {
      type: 'USE_SERVER_CODE',
      code: serverCode,
      reason: 'server provided code'
    };
  }

  // 8. fallback to default
  return {
    type: 'USE_DEFAULT_CODE',
    code: defaultCode,
    reason: 'no draft, no server code'
  };
}

/**
 * determines whether to save draft after processing session_state.
 *
 * key insight from bug fix:
 * - only save if we actually used server/default code
 * - never save if we restored from draft (would overwrite with stale data)
 * - never save if we skipped (no code change happened)
 */
export function decideDraftSave(
  ctx: SessionStateContext,
  codeAction: SessionStateAction
): DraftSaveDecision {
  const { currentStrudelId, currentDraftId, defaultCode } = ctx;

  switch (codeAction.type) {
    case 'RESTORE_DRAFT':
      // we just loaded from draft - don't overwrite it
      return { shouldSave: false, reason: 'restored from draft, no need to save' };

    case 'SKIP_CODE_UPDATE':
      // no code change - don't save
      return { shouldSave: false, reason: 'code update skipped' };

    case 'USE_SERVER_CODE':
      // save server code as backup (useful for strudels and recovery)
      const serverDraftId = currentStrudelId || currentDraftId || `draft_${Date.now()}`;
      return {
        shouldSave: true,
        draftId: serverDraftId,
        code: codeAction.code,
        reason: 'backing up server code to localStorage'
      };

    case 'USE_DEFAULT_CODE':
      // only save default code if there's no existing draft
      // this prevents overwriting user's work with empty/default code
      if (!ctx.latestDraft && !ctx.currentDraft) {
        const defaultDraftId = currentDraftId || `draft_${Date.now()}`;
        return {
          shouldSave: true,
          draftId: defaultDraftId,
          code: defaultCode,
          reason: 'saving initial default code (no existing draft)'
        };
      }
      return {
        shouldSave: false,
        reason: 'default code but draft exists, not overwriting'
      };

    default:
      return { shouldSave: false, reason: 'unknown action type' };
  }
}

/**
 * main decision function - combines code action and draft save decisions.
 * returns a complete, traceable decision object.
 */
export function processSessionState(ctx: SessionStateContext): SessionStateDecision {
  const codeAction = decideCodeAction(ctx);
  const draftSave = decideDraftSave(ctx, codeAction);

  const isLiveSession = ctx.payload.participants && ctx.payload.participants.length > 0;

  return {
    codeAction,
    draftSave,
    debug: {
      context: {
        isLiveSession,
        hasToken: ctx.hasToken,
        currentStrudelId: ctx.currentStrudelId,
        currentDraftId: ctx.currentDraftId,
        hasLatestDraft: ctx.latestDraft !== null,
        hasCurrentDraft: ctx.currentDraft !== null,
        initialLoadComplete: ctx.initialLoadComplete,
        skipCodeRestoration: ctx.skipCodeRestoration,
        hasServerCode: ctx.serverCode !== null,
        requestId: ctx.requestId,
        currentSwitchRequestId: ctx.currentSwitchRequestId,
        participantCount: ctx.payload.participants?.length ?? 0,
        yourRole: ctx.payload.your_role,
      } as Partial<SessionStateContext>,
      timestamp: Date.now(),
    },
  };
}

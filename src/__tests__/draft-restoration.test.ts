import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { storage, Draft } from '@/lib/utils/storage';
import { shouldRestoreFromDraft, pickDraftToRestore } from '@/lib/utils/draft-restoration';
import {
  processSessionState,
  decideCodeAction,
  decideDraftSave,
  type SessionStateContext,
} from '@/lib/websocket/session-state-machine';
import { useEditorStore } from '@/lib/stores/editor';
import { useAuthStore } from '@/lib/stores/auth';

// mock constants
vi.mock('@/lib/constants', () => ({
  STORAGE_KEYS: {
    SESSION_ID: 'algorave_session_id',
    REDIRECT_AFTER_LOGIN: 'algorave_redirect',
  },
  WS_BASE_URL: 'ws://localhost:8000',
  WEBSOCKET: {
    PING_INTERVAL_MS: 30000,
    RECONNECT_DELAY_MS: 1000,
    RECONNECT_MAX_ATTEMPTS: 5,
    CONNECTION_TIMEOUT_MS: 10000,
  },
  EDITOR: {
    DEFAULT_CODE: '// default code',
  },
}));

describe('Draft Restoration Logic', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    
    // reset zustand stores
    useEditorStore.getState().reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('local storage draft operations', () => {
    it('should save and retrieve draft correctly', () => {
      const draft: Draft = {
        id: 'test-draft-1',
        code: 's("bd").fast(2)',
        conversationHistory: [{ role: 'user', content: 'test' }],
        updatedAt: Date.now(),
      };

      storage.setDraft(draft);
      expect(storage.getDraft('test-draft-1')).toEqual(draft);
    });

    it('should get latest draft from multiple drafts', () => {
      const oldDraft: Draft = {
        id: 'old-draft',
        code: 'old code',
        conversationHistory: [],
        updatedAt: Date.now() - 10000,
      };

      const newDraft: Draft = {
        id: 'new-draft',
        code: 'new code',
        conversationHistory: [],
        updatedAt: Date.now(),
      };

      storage.setDraft(oldDraft);
      storage.setDraft(newDraft);

      const latest = storage.getLatestDraft();
      expect(latest?.id).toBe('new-draft');
    });
  });

  describe('anonymous user draft restoration', () => {
    beforeEach(() => {
      // clear auth token to simulate anonymous user
      useAuthStore.getState().clearAuth();
    });

    it('should restore latest draft for anonymous user in new tab', () => {
      // simulate existing draft in localStorage (from previous session)
      const existingDraft: Draft = {
        id: 'anon-draft-1',
        code: 's("hh").fast(4)',
        conversationHistory: [{ role: 'user', content: 'add hi-hat' }],
        updatedAt: Date.now(),
      };
      storage.setDraft(existingDraft);

      // verify the draft can be retrieved
      const latestDraft = storage.getLatestDraft();
      expect(latestDraft).not.toBeNull();
      expect(latestDraft?.code).toBe('s("hh").fast(4)');
    });

    it('should restore same draft on page refresh', () => {
      // setup: anonymous user has a draft in localStorage and draftId in sessionStorage
      const draftId = 'anon-refresh-draft';
      const draft: Draft = {
        id: draftId,
        code: 's("cp")',
        conversationHistory: [],
        updatedAt: Date.now(),
      };
      storage.setDraft(draft);
      storage.setCurrentDraftId(draftId);

      // verify current draft ID is preserved in sessionStorage
      expect(storage.getCurrentDraftId()).toBe(draftId);
      expect(storage.getDraft(draftId)).toEqual(draft);
    });

    it('should preserve forked draft on refresh', () => {
      // simulate fork: new draftId, forked code
      const forkDraftId = storage.generateDraftId();
      const forkedDraft: Draft = {
        id: forkDraftId,
        code: 's("bd", "sd").fast(2)', // forked and modified
        conversationHistory: [],
        updatedAt: Date.now(),
        title: 'Fork of Original',
      };
      storage.setDraft(forkedDraft);
      storage.setCurrentDraftId(forkDraftId);

      // simulate refresh - sessionStorage persists
      expect(storage.getCurrentDraftId()).toBe(forkDraftId);
      const retrieved = storage.getDraft(forkDraftId);
      expect(retrieved?.code).toBe('s("bd", "sd").fast(2)');
      expect(retrieved?.title).toBe('Fork of Original');
    });

    it('should restore forked draft in new tab (via latest draft)', () => {
      // simulate fork with localStorage only (new tab won't have sessionStorage)
      const forkDraftId = storage.generateDraftId();
      const forkedDraft: Draft = {
        id: forkDraftId,
        code: 's("bd", "sd").fast(2)',
        conversationHistory: [],
        updatedAt: Date.now(),
        title: 'Fork of Original',
      };
      storage.setDraft(forkedDraft);
      // no sessionStorage draftId (new tab)

      // new tab should get latest draft
      const latestDraft = storage.getLatestDraft();
      expect(latestDraft?.id).toBe(forkDraftId);
      expect(latestDraft?.code).toBe('s("bd", "sd").fast(2)');
    });
  });

  describe('Authenticated User Draft Restoration', () => {
    beforeEach(() => {
      // simulate authenticated user
      useAuthStore
        .getState()
        .setAuth(
          {
            id: 'user-1',
            name: 'testuser',
            email: 'testuser@example.com',
            provider: 'google',
            ai_features_enabled: true,
            training_consent: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          'test-token'
        );
    });

    it('should restore latest draft for auth user in new tab (no strudel)', () => {
      // auth user has a draft from previous session
      const draft: Draft = {
        id: 'auth-draft-1',
        code: 's("bd").slow(2)',
        conversationHistory: [],
        updatedAt: Date.now(),
      };

      storage.setDraft(draft);

      const latestDraft = storage.getLatestDraft();
      expect(latestDraft).not.toBeNull();
      expect(latestDraft?.code).toBe('s("bd").slow(2)');
    });

    it('should restore same draft on refresh (editing unsaved work)', () => {
      // setup: auth user editing a draft
      const draftId = 'auth-refresh-draft';
      const draft: Draft = {
        id: draftId,
        code: 's("cp").rev()',
        conversationHistory: [],
        updatedAt: Date.now(),
      };

      storage.setDraft(draft);
      storage.setCurrentDraftId(draftId);

      // after refresh, should restore same draft
      expect(storage.getCurrentDraftId()).toBe(draftId);
      expect(storage.getDraft(draftId)?.code).toBe('s("cp").rev()');
    });

    it('should store strudel as backup in localStorage', () => {
      // when auth user loads a saved strudel, it gets backed up to localStorage
      const strudelId = 'strudel-abc-123';
      const strudelCode = 's("bd", "sd", "hh*2", "cp")';

      // simulate strudel being saved as backup
      storage.setDraft({
        id: strudelId,
        code: strudelCode,
        conversationHistory: [],
        updatedAt: Date.now(),
      });

      // verify backup exists
      const backup = storage.getDraft(strudelId);
      expect(backup).not.toBeNull();
      expect(backup?.code).toBe(strudelCode);
    });

    it('should keep draft separate from strudel backup', () => {
      // auth user has both a saved strudel backup and an unsaved draft
      const strudelId = 'strudel-backup';
      const draftId = 'unsaved-draft';

      storage.setDraft({
        id: strudelId,
        code: 'strudel code',
        conversationHistory: [],
        updatedAt: Date.now() - 5000,
      });

      storage.setDraft({
        id: draftId,
        code: 'draft code',
        conversationHistory: [],
        updatedAt: Date.now(),
      });

      storage.setCurrentDraftId(draftId);

      // current draft should be the unsaved draft
      expect(storage.getCurrentDraftId()).toBe(draftId);
      expect(storage.getDraft(draftId)?.code).toBe('draft code');

      // latest draft should be the most recent
      const latest = storage.getLatestDraft();
      expect(latest?.id).toBe(draftId);
    });

    it('should restore forked draft on refresh (auth user)', () => {
      const forkDraftId = storage.generateDraftId();
      storage.setDraft({
        id: forkDraftId,
        code: 'forked and modified',
        conversationHistory: [],
        updatedAt: Date.now(),
        title: 'Fork of Something',
      });
      storage.setCurrentDraftId(forkDraftId);

      // after refresh
      expect(storage.getCurrentDraftId()).toBe(forkDraftId);
      expect(storage.getDraft(forkDraftId)?.code).toBe('forked and modified');
    });

    it('should restore forked draft in new tab (auth user)', () => {
      const forkDraftId = storage.generateDraftId();
      storage.setDraft({
        id: forkDraftId,
        code: 'forked and modified',
        conversationHistory: [],
        updatedAt: Date.now(),
        title: 'Fork of Something',
      });

      // should get via latest draft
      const latest = storage.getLatestDraft();
      expect(latest?.id).toBe(forkDraftId);
    });
  });

  describe('editor store draft saving', () => {
    it('should track dirty state when code changes locally', () => {
      const { setCode, markSaved } = useEditorStore.getState();

      // initially not dirty
      expect(useEditorStore.getState().isDirty).toBe(false);

      // local code change should mark dirty
      setCode('new code', false);
      expect(useEditorStore.getState().isDirty).toBe(true);

      // marking saved should clear dirty
      markSaved();
      expect(useEditorStore.getState().isDirty).toBe(false);
    });

    it('should not mark dirty for remote code changes', () => {
      const { setCode } = useEditorStore.getState();

      // remote code change (fromRemote = true) should not mark dirty
      setCode('remote code', true);
      expect(useEditorStore.getState().isDirty).toBe(false);
    });

    it('should track current strudel ID', () => {
      const { setCurrentStrudel, currentStrudelId } = useEditorStore.getState();

      expect(currentStrudelId).toBeNull();

      setCurrentStrudel('strudel-123', 'Test Strudel');
      expect(useEditorStore.getState().currentStrudelId).toBe('strudel-123');
      expect(useEditorStore.getState().currentStrudelTitle).toBe('Test Strudel');

      // also persists to sessionStorage
      expect(storage.getCurrentStrudelId()).toBe('strudel-123');
    });

    it('should clear strudel ID', () => {
      const { setCurrentStrudel } = useEditorStore.getState();

      setCurrentStrudel('strudel-123', 'Test');
      setCurrentStrudel(null, null);

      expect(useEditorStore.getState().currentStrudelId).toBeNull();
      expect(storage.getCurrentStrudelId()).toBeNull();
    });

    it('should track current draft ID', () => {
      const { setCurrentDraftId } = useEditorStore.getState();

      setCurrentDraftId('draft-xyz');
      expect(useEditorStore.getState().currentDraftId).toBe('draft-xyz');
      expect(storage.getCurrentDraftId()).toBe('draft-xyz');

      setCurrentDraftId(null);
      expect(useEditorStore.getState().currentDraftId).toBeNull();
      expect(storage.getCurrentDraftId()).toBeNull();
    });

    it('should track conversation history', () => {
      const { addToHistory, conversationHistory, clearHistory } =
        useEditorStore.getState();

      expect(conversationHistory).toEqual([]);

      addToHistory({ role: 'user', content: 'make it faster' });
      expect(useEditorStore.getState().conversationHistory).toEqual([
        { role: 'user', content: 'make it faster' },
      ]);

      addToHistory({ role: 'assistant', content: 's("bd").fast(2)' });
      expect(useEditorStore.getState().conversationHistory).toHaveLength(2);

      clearHistory();
      expect(useEditorStore.getState().conversationHistory).toEqual([]);
    });

    it('should reset all state', () => {
      const { setCode, setCurrentStrudel, setCurrentDraftId, addToHistory, reset } =
        useEditorStore.getState();

      // set up some state
      setCode('test code', false);
      setCurrentStrudel('strudel-1', 'Test');
      setCurrentDraftId('draft-1');
      addToHistory({ role: 'user', content: 'test' });

      // reset should clear everything back to initial state
      // (initial state now includes default code from localStorage check)
      reset();
      const state = useEditorStore.getState();
      expect(state.code).toBe('// default code');
      expect(state.isDirty).toBe(false);
      expect(state.currentStrudelId).toBeNull();
      expect(state.currentDraftId).toBeNull();
      expect(state.conversationHistory).toEqual([]);
    });
  });

  describe('sessionStorage vs localStorage behavior', () => {
    it('sessionStorage should be tab-specific (simulated)', () => {
      // this simulates what happens with different tabs
      // in real browser, sessionStorage is per-tab

      storage.setCurrentDraftId('tab1-draft');
      expect(storage.getCurrentDraftId()).toBe('tab1-draft');

      // clearing simulates a new tab (new sessionStorage context)
      sessionStorage.clear();
      expect(storage.getCurrentDraftId()).toBeNull();

      // but localStorage persists
      storage.setDraft({
        id: 'shared-draft',
        code: 'shared code',
        conversationHistory: [],
        updatedAt: Date.now(),
      });

      sessionStorage.clear();
      expect(storage.getDraft('shared-draft')).not.toBeNull();
    });

    it('localStorage should be shared across tabs', () => {
      // draft saved in one "tab"
      storage.setDraft({
        id: 'cross-tab-draft',
        code: 'cross tab code',
        conversationHistory: [],
        updatedAt: Date.now(),
      });

      // clear sessionStorage to simulate new tab
      sessionStorage.clear();

      // localStorage draft should still be accessible
      expect(storage.getDraft('cross-tab-draft')?.code).toBe('cross tab code');
      expect(storage.getLatestDraft()?.id).toBe('cross-tab-draft');
    });
  });

  describe('draft ID generation', () => {
    it('should generate unique draft IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(storage.generateDraftId());
      }
      expect(ids.size).toBe(100);
    });

    it('should generate IDs with correct format', () => {
      const id = storage.generateDraftId();
      expect(id).toMatch(/^draft_\d+_[a-z0-9]+$/);
    });
  });

  /**
   * Tests for the shared draft restoration logic (src/lib/utils/draft-restoration.ts).
   * These functions are used by client.ts to decide whether to restore from localStorage.
   *
   * Decision matrix:
   * - Anonymous user: ALWAYS restore from localStorage draft (server code ignored)
   * - Auth user without strudelId: restore from localStorage draft
   * - Auth user with strudelId: use server code (localStorage is just backup)
   */
  describe('session_state conflict resolution (server vs localStorage)', () => {
    describe('anonymous user scenarios', () => {
      it('should prefer localStorage draft over server code on initial load', () => {
        const localDraft: Draft = {
          id: 'local-draft',
          code: 's("bd").fast(4)', // user's local work
          conversationHistory: [],
          updatedAt: Date.now(),
        };

        const result = shouldRestoreFromDraft({
          hasToken: false,
          currentStrudelId: null,
          latestDraft: localDraft,
          currentDraft: null,
          initialLoadComplete: false,
        });

        expect(result).toBe(true);
        expect(pickDraftToRestore({
          latestDraft: localDraft,
          currentDraft: null,
        })).toEqual(localDraft);
      });

      it('should use server code when no localStorage draft exists', () => {
        const result = shouldRestoreFromDraft({
          hasToken: false,
          currentStrudelId: null,
          latestDraft: null,
          currentDraft: null,
          initialLoadComplete: false,
        });

        expect(result).toBe(false); // no draft to restore, use server code
      });

      it('should not restore draft on reconnect (initialLoadComplete=true)', () => {
        const localDraft: Draft = {
          id: 'local-draft',
          code: 's("bd").fast(4)',
          conversationHistory: [],
          updatedAt: Date.now(),
        };

        const result = shouldRestoreFromDraft({
          hasToken: false,
          currentStrudelId: null,
          latestDraft: localDraft,
          currentDraft: null,
          initialLoadComplete: true, // already loaded, this is a reconnect
        });

        expect(result).toBe(false); // don't override on reconnect
      });
    });

    describe('authenticated user scenarios (no saved strudel)', () => {
      it('should prefer localStorage draft over server code for unsaved work', () => {
        const localDraft: Draft = {
          id: 'auth-draft',
          code: 's("hh*4")', // user's local unsaved work
          conversationHistory: [{ role: 'user', content: 'add hats' }],
          updatedAt: Date.now(),
        };

        const result = shouldRestoreFromDraft({
          hasToken: true,
          currentStrudelId: null, // no saved strudel being edited
          latestDraft: localDraft,
          currentDraft: localDraft,
          initialLoadComplete: false,
        });

        expect(result).toBe(true);
      });

      it('should prefer currentDraft over latestDraft for same-tab refresh', () => {
        const currentDraft: Draft = {
          id: 'current-tab-draft',
          code: 's("cp").slow(2)',
          conversationHistory: [],
          updatedAt: Date.now() - 1000, // slightly older
        };

        const latestDraft: Draft = {
          id: 'other-tab-draft',
          code: 's("bd")',
          conversationHistory: [],
          updatedAt: Date.now(), // newer but from another tab
        };

        const picked = pickDraftToRestore({
          latestDraft,
          currentDraft,
        });

        // should prefer currentDraft (same tab) over latestDraft
        expect(picked).toEqual(currentDraft);
      });

      it('should fallback to latestDraft in new tab (no currentDraft)', () => {
        const latestDraft: Draft = {
          id: 'latest-draft',
          code: 's("bd")',
          conversationHistory: [],
          updatedAt: Date.now(),
        };

        const picked = pickDraftToRestore({
          latestDraft,
          currentDraft: null, // new tab, no sessionStorage
        });

        expect(picked).toEqual(latestDraft);
      });
    });

    describe('authenticated user scenarios (editing saved strudel)', () => {
      it('should use server code when editing a saved strudel', () => {
        const localDraft: Draft = {
          id: 'strudel-123', // backup of the strudel
          code: 's("bd").fast(2)', // local backup
          conversationHistory: [],
          updatedAt: Date.now(),
        };

        const result = shouldRestoreFromDraft({
          hasToken: true,
          currentStrudelId: 'strudel-123', // editing a saved strudel
          latestDraft: localDraft,
          currentDraft: localDraft,
          initialLoadComplete: false,
        });

        expect(result).toBe(false); // server code wins for saved strudels
      });

      it('should still backup server code to localStorage for safety', () => {
        // this tests that even though we use server code,
        // we still save it to localStorage as a backup
        const strudelId = 'strudel-abc';
        const serverCode = 's("bd", "sd", "hh*2")';

        // simulate backing up server code
        storage.setDraft({
          id: strudelId,
          code: serverCode,
          conversationHistory: [],
          updatedAt: Date.now(),
        });

        const backup = storage.getDraft(strudelId);
        expect(backup?.code).toBe(serverCode);
      });
    });

    describe('conflict scenarios with different code', () => {
      it('anonymous: localStorage code should win over different server code', () => {
        const serverCode = 's("bd")'; // server has this
        const localCode = 's("bd").fast(8).rev()'; // user modified locally

        const localDraft: Draft = {
          id: 'anon-draft',
          code: localCode,
          conversationHistory: [],
          updatedAt: Date.now(),
        };

        storage.setDraft(localDraft);

        // verify decision logic
        const shouldRestore = shouldRestoreFromDraft({
          hasToken: false,
          currentStrudelId: null,
          latestDraft: localDraft,
          currentDraft: null,
          initialLoadComplete: false,
        });

        expect(shouldRestore).toBe(true);

        // localStorage code should be used
        const draftToUse = pickDraftToRestore({
          latestDraft: localDraft,
          currentDraft: null,
        });
        expect(draftToUse?.code).toBe(localCode);
        expect(draftToUse?.code).not.toBe(serverCode);
      });

      it('auth (unsaved): localStorage code should win over different server code', () => {
        // server would send: 's("hh")'
        const localCode = 's("hh*4").gain(0.5)';

        const localDraft: Draft = {
          id: 'auth-unsaved-draft',
          code: localCode,
          conversationHistory: [],
          updatedAt: Date.now(),
        };

        storage.setDraft(localDraft);
        storage.setCurrentDraftId('auth-unsaved-draft');

        const shouldRestore = shouldRestoreFromDraft({
          hasToken: true,
          currentStrudelId: null, // not editing a saved strudel
          latestDraft: localDraft,
          currentDraft: localDraft,
          initialLoadComplete: false,
        });

        expect(shouldRestore).toBe(true);

        const draftToUse = pickDraftToRestore({
          latestDraft: localDraft,
          currentDraft: localDraft,
        });
        expect(draftToUse?.code).toBe(localCode);
      });

      it('auth (saved strudel): server code should win, local is just backup', () => {
        // server would send: 's("bd", "sd")' - authoritative version
        const localBackupCode = 's("bd", "sd").fast(2)'; // outdated local backup

        const localBackup: Draft = {
          id: 'my-strudel-id',
          code: localBackupCode,
          conversationHistory: [],
          updatedAt: Date.now() - 60000, // older
        };

        storage.setDraft(localBackup);

        const shouldRestore = shouldRestoreFromDraft({
          hasToken: true,
          currentStrudelId: 'my-strudel-id', // editing this saved strudel
          latestDraft: localBackup,
          currentDraft: localBackup,
          initialLoadComplete: false,
        });

        // should NOT restore from draft - server is authoritative for saved strudels
        expect(shouldRestore).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle empty code in localStorage draft', () => {
        const emptyDraft: Draft = {
          id: 'empty-draft',
          code: '', // user cleared the code
          conversationHistory: [],
          updatedAt: Date.now(),
        };

        storage.setDraft(emptyDraft);

        // empty code is still valid - user might have intentionally cleared it
        const shouldRestore = shouldRestoreFromDraft({
          hasToken: false,
          currentStrudelId: null,
          latestDraft: emptyDraft,
          currentDraft: null,
          initialLoadComplete: false,
        });

        expect(shouldRestore).toBe(true);
      });

      it('should handle conversation history in draft', () => {
        const draftWithHistory: Draft = {
          id: 'draft-with-chat',
          code: 's("bd")',
          conversationHistory: [
            { role: 'user', content: 'make it faster' },
            { role: 'assistant', content: 's("bd").fast(2)' },
          ],
          updatedAt: Date.now(),
        };

        storage.setDraft(draftWithHistory);

        const retrieved = storage.getDraft('draft-with-chat');
        expect(retrieved?.conversationHistory).toHaveLength(2);
        expect(retrieved?.conversationHistory[0].role).toBe('user');
      });

      it('should prefer the most recent draft when multiple exist', () => {
        const oldDraft: Draft = {
          id: 'old-work',
          code: 's("bd")',
          conversationHistory: [],
          updatedAt: Date.now() - 100000,
        };

        const recentDraft: Draft = {
          id: 'recent-work',
          code: 's("bd", "sd", "hh")',
          conversationHistory: [],
          updatedAt: Date.now(),
        };

        storage.setDraft(oldDraft);
        storage.setDraft(recentDraft);

        const latest = storage.getLatestDraft();
        expect(latest?.id).toBe('recent-work');
        expect(latest?.code).toBe('s("bd", "sd", "hh")');
      });
    });
  });

  /**
   * tests for the session state machine (src/lib/websocket/session-state-machine.ts).
   * this tests the complete decision flow including draft save decisions.
   *
   * key bug fix tested: draft should NOT be saved when:
   * - we restored from draft (would overwrite with stale server code)
   * - we skipped code update (no code change happened)
   */
  describe('session state machine', () => {
    const createMockPayload = (code?: string) => ({
      code: code ?? '',
      your_role: 'host', 
      participants: [],
            chat_history: [],
      request_id: undefined,
    });

    const createContext = (
      overrides: Partial<SessionStateContext> = {}
    ): SessionStateContext => ({
      hasToken: false,
      currentStrudelId: null,
      currentDraftId: null,
      latestDraft: null,
      currentDraft: null,
      initialLoadComplete: false,
      skipCodeRestoration: false,
      requestId: null,
      currentSwitchRequestId: null,
      // @ts-expect-error - mock payload
      payload: createMockPayload(),
      serverCode: null,
      defaultCode: '// default',
      ...overrides,
    });

    describe('decideCodeAction', () => {
      it('should skip when skipCodeRestoration is true', () => {
        const ctx = createContext({ skipCodeRestoration: true });
        const action = decideCodeAction(ctx);
        expect(action.type).toBe('SKIP_CODE_UPDATE');
      });

      it('should skip on reconnect (initialLoadComplete=true)', () => {
        const ctx = createContext({ initialLoadComplete: true });
        const action = decideCodeAction(ctx);
        expect(action.type).toBe('SKIP_CODE_UPDATE');
      });

      it('should restore draft for anonymous user', () => {
        const draft: Draft = {
          id: 'anon-draft',
          code: 's("hh")',
          conversationHistory: [],
          updatedAt: Date.now(),
        };

        const ctx = createContext({
          hasToken: false,
          latestDraft: draft,
        });

        const action = decideCodeAction(ctx);
        expect(action.type).toBe('RESTORE_DRAFT');

        if (action.type === 'RESTORE_DRAFT') {
          expect(action.draft).toEqual(draft);
        }
      });

      it('should prefer currentDraft over latestDraft for anonymous user (fork bug fix)', () => {
        // BUG FIX: anonymous user forks a strudel, then refreshes
        // the forked draft (currentDraft) should be used, not the old default (latestDraft)
        const oldDefaultDraft: Draft = {
          id: 'old-default',
          code: '// default code',
          conversationHistory: [],
          updatedAt: Date.now() + 1000, // newer timestamp but wrong draft
        };

        const forkedDraft: Draft = {
          id: 'forked-draft',
          code: 's("bd", "sd").fast(2)', // forked code
          conversationHistory: [],
          updatedAt: Date.now(), // older timestamp but correct draft
        };

        const ctx = createContext({
          hasToken: false,
          latestDraft: oldDefaultDraft, // would incorrectly restore this before fix
          currentDraft: forkedDraft, // should restore this
        });

        const action = decideCodeAction(ctx);
        expect(action.type).toBe('RESTORE_DRAFT');

        if (action.type === 'RESTORE_DRAFT') {
          // should use currentDraft (forked), not latestDraft (old default)
          expect(action.draft).toEqual(forkedDraft);
          expect(action.draft.code).toBe('s("bd", "sd").fast(2)');
          expect(action.reason).toContain('currentDraft');
        }
      });

      it('should restore draft for auth user without strudel', () => {
        const draft: Draft = {
          id: 'auth-draft',
          code: 's("cp")',
          conversationHistory: [],
          updatedAt: Date.now(),
        };
        const ctx = createContext({
          hasToken: true,
          currentStrudelId: null,
          currentDraft: draft,
        });
        const action = decideCodeAction(ctx);
        expect(action.type).toBe('RESTORE_DRAFT');
      });

      it('should use server code for auth user with strudel', () => {
        const ctx = createContext({
          hasToken: true,
          currentStrudelId: 'strudel-123',
          serverCode: 's("bd", "sd")',
        });
        const action = decideCodeAction(ctx);
        expect(action.type).toBe('USE_SERVER_CODE');
        expect(action.reason).toContain('strudel');
      });

      it('should use default code when no draft and no server code', () => {
        const ctx = createContext({
          hasToken: false,
          latestDraft: null,
          serverCode: null,
          defaultCode: '// default',
        });
        const action = decideCodeAction(ctx);
        expect(action.type).toBe('USE_DEFAULT_CODE');
      });
    });

    describe('decideDraftSave - BUG FIX TESTS', () => {
      it('should NOT save draft when restored from draft', () => {
        const draft: Draft = {
          id: 'restored-draft',
          code: 's("hh")',
          conversationHistory: [],
          updatedAt: Date.now(),
        };

        const ctx = createContext({ latestDraft: draft });
        const codeAction = { type: 'RESTORE_DRAFT' as const, draft, reason: 'test' };
        const saveDecision = decideDraftSave(ctx, codeAction);

        expect(saveDecision.shouldSave).toBe(false);
        expect(saveDecision.reason).toContain('restored from draft');
      });

      it('should NOT save draft when code update skipped', () => {
        const ctx = createContext();
        const codeAction = { type: 'SKIP_CODE_UPDATE' as const, reason: 'reconnect' };
        const saveDecision = decideDraftSave(ctx, codeAction);

        expect(saveDecision.shouldSave).toBe(false);
      });

      it('should save draft when using server code', () => {
        const ctx = createContext({
          currentStrudelId: 'strudel-123',
          serverCode: 's("bd")',
        });
        const codeAction = { type: 'USE_SERVER_CODE' as const, code: 's("bd")', reason: 'server' };
        const saveDecision = decideDraftSave(ctx, codeAction);

        expect(saveDecision.shouldSave).toBe(true);
        if (saveDecision.shouldSave) {
          expect(saveDecision.code).toBe('s("bd")');
        }
      });

      it('should NOT save default code when draft exists (prevents overwrite bug)', () => {
        const existingDraft: Draft = {
          id: 'existing',
          code: 's("hh*4")',
          conversationHistory: [],
          updatedAt: Date.now(),
        };

        const ctx = createContext({
          latestDraft: existingDraft,
          defaultCode: '// default',
        });
        const codeAction = { type: 'USE_DEFAULT_CODE' as const, code: '// default', reason: 'fallback' };
        const saveDecision = decideDraftSave(ctx, codeAction);

        // This is the key bug fix - don't overwrite existing draft with default code
        expect(saveDecision.shouldSave).toBe(false);
        expect(saveDecision.reason).toContain('not overwriting');
      });

      it('should save default code only when no draft exists', () => {
        const ctx = createContext({
          latestDraft: null,
          currentDraft: null,
          defaultCode: '// default',
        });
        const codeAction = { type: 'USE_DEFAULT_CODE' as const, code: '// default', reason: 'fallback' };
        const saveDecision = decideDraftSave(ctx, codeAction);

        expect(saveDecision.shouldSave).toBe(true);
      });
    });

    describe('processSessionState - integration', () => {
      it('should return complete decision with debug info', () => {
        const draft: Draft = {
          id: 'test-draft',
          code: 's("bd")',
          conversationHistory: [],
          updatedAt: Date.now(),
        };

        const ctx = createContext({
          hasToken: false,
          latestDraft: draft,
        });

        const decision = processSessionState(ctx);

        expect(decision.codeAction.type).toBe('RESTORE_DRAFT');
        expect(decision.draftSave.shouldSave).toBe(false);
        expect(decision.debug.timestamp).toBeDefined();
        expect(decision.debug.context).toBeDefined();
      });

      it('should handle the race condition scenario (strudel ID set before session_state)', () => {
        // This tests the bug: when currentStrudelId is set due to race condition,
        // server code should be used but draft should still be preserved
        const existingDraft: Draft = {
          id: 'my-work',
          code: 's("hh*8").gain(0.5)',
          conversationHistory: [],
          updatedAt: Date.now(),
        };

        const ctx = createContext({
          hasToken: true,
          currentStrudelId: 'strudel-from-api', // Race condition: set before session_state
          latestDraft: existingDraft,
          serverCode: 's("bd")', // Server code for the strudel
        });

        const decision = processSessionState(ctx);

        // Should use server code because strudel is authoritative
        expect(decision.codeAction.type).toBe('USE_SERVER_CODE');

        // Should save the strudel code as backup
        expect(decision.draftSave.shouldSave).toBe(true);

        // The existing draft in localStorage is NOT overwritten because
        // we save with the strudel ID, not the draft ID
        if (decision.draftSave.shouldSave) {
          expect(decision.draftSave.draftId).toBe('strudel-from-api');
        }
      });
    });

    describe('live session behavior', () => {
      it('should use server code in live session even if user has draft', () => {
        const userDraft: Draft = {
          id: 'my-draft',
          code: 's("hh*4")',
          conversationHistory: [],
          updatedAt: Date.now(),
        };

        const ctx = createContext({
          hasToken: false, // anonymous joiner
          latestDraft: userDraft,
          serverCode: 's("bd", "sd").fast(2)', // host's code
          payload: {
            code: 's("bd", "sd").fast(2)',
            your_role: 'viewer',
            // @ts-expect-error - mock payload with participants
            participants: [{ id: 'host-123', display_name: 'Host', role: 'host' }],
                        chat_history: [],
          },
        });

        const action = decideCodeAction(ctx);

        // should use server code, NOT restore from draft
        expect(action.type).toBe('USE_SERVER_CODE');
        expect(action.reason).toContain('live session');
        expect(action.reason).toContain('1 participant');
      });

      it('should use server code for host in live session with participants', () => {
        const hostDraft: Draft = {
          id: 'host-draft',
          code: 's("old code")',
          conversationHistory: [],
          updatedAt: Date.now(),
        };

        const ctx = createContext({
          hasToken: true, // authenticated host
          latestDraft: hostDraft,
          serverCode: 's("current live code")',
          payload: {
            code: 's("current live code")',
            your_role: 'host',
            participants: [
              // @ts-expect-error - mock payload with participants
              { id: 'viewer-1', display_name: 'Viewer 1', role: 'viewer' },
              // @ts-expect-error - mock payload with participants
              { id: 'viewer-2', display_name: 'Viewer 2', role: 'viewer' },
            ],
                        chat_history: [],
          },
        });

        const action = decideCodeAction(ctx);

        // Even host should use server code in live session
        expect(action.type).toBe('USE_SERVER_CODE');
        expect(action.reason).toContain('2 participant');
      });

      it('should restore draft for solo session (no participants)', () => {
        const soloDraft: Draft = {
          id: 'solo-draft',
          code: 's("my solo work")',
          conversationHistory: [],
          updatedAt: Date.now(),
        };

        const ctx = createContext({
          hasToken: false,
          latestDraft: soloDraft,
          serverCode: 's("bd")', // some server code
          payload: {
            code: 's("bd")',
            your_role: 'host',
            participants: [], // empty = solo session
                        chat_history: [],
          },
        });

        const action = decideCodeAction(ctx);

        // Solo session should restore from draft
        expect(action.type).toBe('RESTORE_DRAFT');
        expect(action.reason).toContain('solo');
      });

      it('should include live session info in debug context', () => {
        const ctx = createContext({
          serverCode: 's("bd")',
          payload: {
            code: 's("bd")',
            your_role: 'viewer',
            // @ts-expect-error - mock payload
            participants: [{ id: 'host', display_name: 'Host', role: 'host' }],
                        chat_history: [],
          },
        });

        const decision = processSessionState(ctx);

        // @ts-expect-error - mock
        expect(decision.debug.context.isLiveSession).toBe(true); // @ts-expect-error - mock
        expect(decision.debug.context.participantCount).toBe(1); // @ts-expect-error - mock 
        expect(decision.debug.context.yourRole).toBe('viewer');
      });
    });
  });
});

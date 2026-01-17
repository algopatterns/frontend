import { create } from 'zustand';

// sidebar panel constraints
const CHAT_PANEL_MIN_WIDTH = 280;
const CHAT_PANEL_MAX_WIDTH = 600;
const CHAT_PANEL_DEFAULT_WIDTH = 320;

// AI drawer constraints
const AI_DRAWER_MIN_HEIGHT = 100;
const AI_DRAWER_MAX_HEIGHT = 2000; // CSS calc() handles actual max based on viewport
const AI_DRAWER_DEFAULT_HEIGHT = 200;

interface UIState {
  isChatPanelOpen: boolean;
  chatPanelWidth: number;
  aiDrawerHeight: number;
  sidebarTab: 'samples' | 'chat';
  isDraftsModalOpen: boolean;
  isInviteDialogOpen: boolean;
  isLoginModalOpen: boolean;
  isLogoutDialogOpen: boolean;
  isNewStrudelDialogOpen: boolean;
  isSaveStrudelDialogOpen: boolean;
  isSettingsModalOpen: boolean;
  isSidebarOpen: boolean;
  pendingForkId: string | null;
  pendingOpenStrudelId: string | null;

  toggleChatPanel: () => void;
  setChatPanelOpen: (open: boolean) => void;
  setChatPanelWidth: (width: number) => void;
  setAIDrawerHeight: (height: number) => void;
  setSidebarTab: (tab: 'samples' | 'chat') => void;
  setDraftsModalOpen: (open: boolean) => void;
  setInviteDialogOpen: (open: boolean) => void;
  setLoginModalOpen: (open: boolean) => void;
  setLogoutDialogOpen: (open: boolean) => void;
  setNewStrudelDialogOpen: (open: boolean) => void;
  setSaveStrudelDialogOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setPendingForkId: (id: string | null) => void;
  setPendingOpenStrudelId: (id: string | null) => void;
}

export const useUIStore = create<UIState>(set => ({
  isChatPanelOpen: true,
  chatPanelWidth: CHAT_PANEL_DEFAULT_WIDTH,
  aiDrawerHeight: AI_DRAWER_DEFAULT_HEIGHT,
  sidebarTab: 'samples',
  isDraftsModalOpen: false,
  isInviteDialogOpen: false,
  isLoginModalOpen: false,
  isLogoutDialogOpen: false,
  isNewStrudelDialogOpen: false,
  isSaveStrudelDialogOpen: false,
  isSettingsModalOpen: false,
  isSidebarOpen: false,
  pendingForkId: null,
  pendingOpenStrudelId: null,

  setChatPanelWidth: width => {
    set({
      chatPanelWidth: Math.min(
        CHAT_PANEL_MAX_WIDTH,
        Math.max(CHAT_PANEL_MIN_WIDTH, width)
      ),
    });
  },

  setAIDrawerHeight: height => {
    set({
      aiDrawerHeight: Math.min(
        AI_DRAWER_MAX_HEIGHT,
        Math.max(AI_DRAWER_MIN_HEIGHT, height)
      ),
    });
  },

  setSidebarOpen: isSidebarOpen => set({ isSidebarOpen }),
  setSidebarTab: sidebarTab => set({ sidebarTab }),
  setPendingForkId: pendingForkId => set({ pendingForkId }),
  setPendingOpenStrudelId: pendingOpenStrudelId => set({ pendingOpenStrudelId }),
  setChatPanelOpen: isChatPanelOpen => set({ isChatPanelOpen }),
  setDraftsModalOpen: isDraftsModalOpen => set({ isDraftsModalOpen }),
  setInviteDialogOpen: isInviteDialogOpen => set({ isInviteDialogOpen }),
  setLoginModalOpen: isLoginModalOpen => set({ isLoginModalOpen }),
  setLogoutDialogOpen: isLogoutDialogOpen => set({ isLogoutDialogOpen }),
  setNewStrudelDialogOpen: isNewStrudelDialogOpen => set({ isNewStrudelDialogOpen }),
  setSaveStrudelDialogOpen: isSaveStrudelDialogOpen => set({ isSaveStrudelDialogOpen }),
  setSettingsModalOpen: isSettingsModalOpen => set({ isSettingsModalOpen }),
  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),

  toggleChatPanel: () => {
    return set(state => ({ isChatPanelOpen: !state.isChatPanelOpen }));
  },
}));

import { create } from 'zustand';

interface UIState {
  isChatPanelOpen: boolean;
  isInviteDialogOpen: boolean;
  isLoginModalOpen: boolean;
  isLogoutDialogOpen: boolean;
  isNewStrudelDialogOpen: boolean;
  isSaveStrudelDialogOpen: boolean;
  isSidebarOpen: boolean;
  pendingForkId: string | null;
  pendingOpenStrudelId: string | null;

  toggleChatPanel: () => void;
  setChatPanelOpen: (open: boolean) => void;
  setInviteDialogOpen: (open: boolean) => void;
  setLoginModalOpen: (open: boolean) => void;
  setLogoutDialogOpen: (open: boolean) => void;
  setNewStrudelDialogOpen: (open: boolean) => void;
  setSaveStrudelDialogOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setPendingForkId: (id: string | null) => void;
  setPendingOpenStrudelId: (id: string | null) => void;
}

export const useUIStore = create<UIState>(set => ({
  isChatPanelOpen: true,
  isInviteDialogOpen: false,
  isLoginModalOpen: false,
  isLogoutDialogOpen: false,
  isNewStrudelDialogOpen: false,
  isSaveStrudelDialogOpen: false,
  isSidebarOpen: false,
  pendingForkId: null,
  pendingOpenStrudelId: null,

  setSidebarOpen: isSidebarOpen => set({ isSidebarOpen }),
  setPendingForkId: pendingForkId => set({ pendingForkId }),
  setPendingOpenStrudelId: pendingOpenStrudelId => set({ pendingOpenStrudelId }),
  setChatPanelOpen: isChatPanelOpen => set({ isChatPanelOpen }),
  setInviteDialogOpen: isInviteDialogOpen => set({ isInviteDialogOpen }),
  setLoginModalOpen: isLoginModalOpen => set({ isLoginModalOpen }),
  setLogoutDialogOpen: isLogoutDialogOpen => set({ isLogoutDialogOpen }),
  setNewStrudelDialogOpen: isNewStrudelDialogOpen => set({ isNewStrudelDialogOpen }),
  setSaveStrudelDialogOpen: isSaveStrudelDialogOpen => set({ isSaveStrudelDialogOpen }),
  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),

  toggleChatPanel: () => {
    return set(state => ({ isChatPanelOpen: !state.isChatPanelOpen }));
  },
}));

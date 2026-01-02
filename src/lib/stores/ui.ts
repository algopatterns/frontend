import { create } from "zustand";

interface UIState {
  isChatPanelOpen: boolean;
  isTransferDialogOpen: boolean;
  isInviteDialogOpen: boolean;
  isSidebarOpen: boolean;

  toggleChatPanel: () => void;
  setChatPanelOpen: (open: boolean) => void;
  setTransferDialogOpen: (open: boolean) => void;
  setInviteDialogOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isChatPanelOpen: true,
  isTransferDialogOpen: false,
  isInviteDialogOpen: false,
  isSidebarOpen: false,

  toggleChatPanel: () =>
    set((state) => ({ isChatPanelOpen: !state.isChatPanelOpen })),
  setChatPanelOpen: (isChatPanelOpen) => set({ isChatPanelOpen }),
  setTransferDialogOpen: (isTransferDialogOpen) =>
    set({ isTransferDialogOpen }),
  setInviteDialogOpen: (isInviteDialogOpen) => set({ isInviteDialogOpen }),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

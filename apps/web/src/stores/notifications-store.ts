import { create } from "zustand";

interface NotificationsState {
  newRecipientEmail: string;
  deletingRecipientId: string | null;
  setNewRecipientEmail: (email: string) => void;
  setDeletingRecipientId: (id: string | null) => void;
  resetNewRecipientEmail: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  newRecipientEmail: "",
  deletingRecipientId: null,
  setNewRecipientEmail: (email) => set({ newRecipientEmail: email }),
  setDeletingRecipientId: (id) => set({ deletingRecipientId: id }),
  resetNewRecipientEmail: () => set({ newRecipientEmail: "" }),
}));

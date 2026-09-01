import { create } from "zustand";

interface IntegrationsState {
  disconnectingIntegration: string | null; // 'google-sheets' | 'airtable'
  setDisconnectingIntegration: (integration: string | null) => void;
}

export const useIntegrationsStore = create<IntegrationsState>((set) => ({
  disconnectingIntegration: null,
  setDisconnectingIntegration: (integration) =>
    set({ disconnectingIntegration: integration }),
}));

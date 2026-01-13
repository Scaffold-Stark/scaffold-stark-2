import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type HistoryStatus = "success" | "error";
export type HistoryEntry = {
  txHash?: string;
  functionName: string;
  timestamp: number;
  status: HistoryStatus;
  message: string;
  input?: string;
};

type HistoryState = {
  historyByContract: Record<string, HistoryEntry[]>; // key: contractAddress
  addHistory: (contractAddress: string, entry: HistoryEntry) => void;
  clearHistory: (contractAddress: string) => void;
};

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      historyByContract: {},
      addHistory: (contractAddress: string, entry: HistoryEntry) =>
        set((state) => {
          const current = state.historyByContract[contractAddress] || [];
          return {
            historyByContract: {
              ...state.historyByContract,
              [contractAddress]: [entry, ...current].slice(0, 200),
            },
          } as Partial<HistoryState> as HistoryState;
        }),
      clearHistory: (contractAddress: string) =>
        set((state) => {
          const copy = { ...state.historyByContract };
          delete copy[contractAddress];
          return {
            historyByContract: copy,
          } as Partial<HistoryState> as HistoryState;
        }),
    }),
    {
      name: "scaffoldStark2.history",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

// Convenience helpers for non-hook contexts
export const addHistory = (contractAddress: string, entry: HistoryEntry) =>
  useHistoryStore.getState().addHistory(contractAddress, entry);
export const clearHistory = (contractAddress: string) =>
  useHistoryStore.getState().clearHistory(contractAddress);

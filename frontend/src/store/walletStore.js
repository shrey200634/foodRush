import { create } from "zustand";
import api from "../api/axios";

export const useWalletStore = create((set) => ({
  balance: null,
  transactions: [],
  loading: false,
  error: null,

  fetchBalance: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get("/wallet/balance");
      set({ balance: res.data?.balance ?? res.data ?? 0, loading: false });
    } catch (err) {
      // Don't let this error propagate — just show 0 balance
      console.warn("Failed to fetch wallet balance:", err.message);
      set({ balance: 0, loading: false, error: "Could not load balance" });
    }
  },

  addFunds: async (amount) => {
    const res = await api.post("/wallet/add-funds", { amount });
    const newBalance = res.data?.balance ?? res.data;
    if (newBalance !== undefined) set({ balance: newBalance });
    return res.data;
  },

  fetchTransactions: async () => {
    try {
      const res = await api.get("/transactions");
      set({ transactions: Array.isArray(res.data) ? res.data : (res.data?.content || []) });
    } catch (err) {
      console.warn("Failed to fetch transactions:", err.message);
      set({ transactions: [] });
    }
  },
}));

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
      set({ balance: res.data?.availableBalance ?? res.data?.balance ?? 0, loading: false });
    } catch (err) {
      try {
        const createRes = await api.post("/wallet/create");
        set({ balance: createRes.data?.availableBalance ?? createRes.data?.balance ?? 0, loading: false });
      } catch (createErr) {
        console.warn("Failed to fetch or create wallet:", createErr.message);
        set({ balance: 0, loading: false, error: "Could not load balance" });
      }
    }
  },

  addFunds: async (amount) => {
    const res = await api.post("/wallet/add-funds", { amount });
    const newBalance = res.data?.availableBalance ?? res.data?.balance;
    if (newBalance !== undefined) set({ balance: newBalance });
    return res.data;
  },

  fetchTransactions: async () => {
    try {
      const res = await api.get("/transactions");
      set({ transactions: Array.isArray(res.data) ? res.data : (res.data?.transactions || []) });
    } catch (err) {
      console.warn("Failed to fetch transactions:", err.message);
      set({ transactions: [] });
    }
  },
}));

import { create } from "zustand";
import api from "../api/axios";

export const useOrderStore = create((set, get) => ({
  orders: [],
  currentOrder: null,
  loading: false,

  placeOrder: async (addressId) => {
    const res = await api.post("/orders/place", { deliveryAddressId: addressId });
    return res.data;
  },

  fetchMyOrders: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/orders/my");
      set({ orders: res.data || [], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchOrder: async (orderId) => {
    set({ loading: true });
    try {
      const res = await api.get(`/orders/${orderId}`);
      set({ currentOrder: res.data, loading: false });
      return res.data;
    } catch {
      set({ loading: false });
    }
  },

  cancelOrder: async (orderId) => {
    const res = await api.post(`/orders/${orderId}/cancel`);
    set((s) => ({
      orders: s.orders.map((o) =>
        o.orderId === orderId ? { ...o, status: "CANCELLED" } : o
      ),
      currentOrder:
        s.currentOrder?.orderId === orderId
          ? { ...s.currentOrder, status: "CANCELLED" }
          : s.currentOrder,
    }));
    return res.data;
  },
}));

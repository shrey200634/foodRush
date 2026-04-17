import { create } from "zustand";
import api from "../api/axios";

export const useOwnerStore = create((set, get) => ({
  restaurants: [],
  currentRestaurant: null,
  menuItems: [],
  categories: [],
  orders: [],
  activeOrders: [],
  loading: false,
  menuLoading: false,
  ordersLoading: false,

  // ── Restaurants ──────────────────────────────────────────────────────
  fetchMyRestaurants: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/restaurants/my");
      const list = Array.isArray(res.data) ? res.data : [res.data];
      set({ restaurants: list, loading: false });
      if (list.length > 0 && !get().currentRestaurant) {
        set({ currentRestaurant: list[0] });
      }
      return list;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  selectRestaurant: (restaurant) => {
    set({ currentRestaurant: restaurant });
  },

  createRestaurant: async (data) => {
    const res = await api.post("/restaurants", data);
    set((s) => ({ restaurants: [...s.restaurants, res.data] }));
    return res.data;
  },

  updateRestaurant: async (id, data) => {
    const res = await api.put(`/restaurants/${id}`, data);
    set((s) => ({
      restaurants: s.restaurants.map((r) =>
        r.restaurantId === id ? res.data : r
      ),
      currentRestaurant:
        s.currentRestaurant?.restaurantId === id
          ? res.data
          : s.currentRestaurant,
    }));
    return res.data;
  },

  toggleOpen: async (restaurantId) => {
    const res = await api.patch(`/restaurants/${restaurantId}/toggle`);
    set((s) => ({
      restaurants: s.restaurants.map((r) =>
        r.restaurantId === restaurantId ? res.data : r
      ),
      currentRestaurant:
        s.currentRestaurant?.restaurantId === restaurantId
          ? res.data
          : s.currentRestaurant,
    }));
    return res.data;
  },

  // ── Menu ──────────────────────────────────────────────────────────────
  fetchMenu: async (restaurantId) => {
    set({ menuLoading: true });
    try {
      const [items, cats] = await Promise.all([
        api.get(`/restaurants/${restaurantId}/menu/all`),
        api.get(`/restaurants/${restaurantId}/menu/categories`),
      ]);
      set({
        menuItems: items.data || [],
        categories: cats.data || [],
        menuLoading: false,
      });
    } catch {
      set({ menuLoading: false });
    }
  },

  addMenuItem: async (restaurantId, data) => {
    const res = await api.post(`/restaurants/${restaurantId}/menu/items`, data);
    set((s) => ({ menuItems: [...s.menuItems, res.data] }));
    return res.data;
  },

  updateMenuItem: async (restaurantId, itemId, data) => {
    const res = await api.put(
      `/restaurants/${restaurantId}/menu/items/${itemId}`,
      data
    );
    set((s) => ({
      menuItems: s.menuItems.map((i) =>
        i.itemId === itemId ? res.data : i
      ),
    }));
    return res.data;
  },

  toggleItemAvailability: async (restaurantId, itemId) => {
    const res = await api.patch(
      `/restaurants/${restaurantId}/menu/items/${itemId}/toggle`
    );
    set((s) => ({
      menuItems: s.menuItems.map((i) =>
        i.itemId === itemId ? res.data : i
      ),
    }));
    return res.data;
  },

  deleteMenuItem: async (restaurantId, itemId) => {
    await api.delete(`/restaurants/${restaurantId}/menu/items/${itemId}`);
    set((s) => ({
      menuItems: s.menuItems.filter((i) => i.itemId !== itemId),
    }));
  },

  addCategory: async (restaurantId, data) => {
    const res = await api.post(
      `/restaurants/${restaurantId}/menu/categories`,
      data
    );
    set((s) => ({ categories: [...s.categories, res.data] }));
    return res.data;
  },

  // ── Orders ────────────────────────────────────────────────────────────
  fetchOrders: async (restaurantId) => {
    set({ ordersLoading: true });
    try {
      const res = await api.get(`/orders/restaurant/${restaurantId}`);
      set({ orders: res.data || [], ordersLoading: false });
    } catch {
      set({ ordersLoading: false });
    }
  },

  fetchActiveOrders: async (restaurantId) => {
    try {
      const res = await api.get(`/orders/restaurant/${restaurantId}/active`);
      set({ activeOrders: res.data || [] });
    } catch {}
  },

  acceptOrder: async (restaurantId, orderId, prepTimeMins = 25) => {
    const res = await api.post(
      `/restaurants/${restaurantId}/accept-order/${orderId}`,
      null,
      { params: { prepTimeMins } }
    );
    // Update order list
    set((s) => ({
      activeOrders: s.activeOrders.map((o) =>
        o.orderId === orderId ? { ...o, status: "ACCEPTED" } : o
      ),
      orders: s.orders.map((o) =>
        o.orderId === orderId ? { ...o, status: "ACCEPTED" } : o
      ),
    }));
    return res.data;
  },

  updateOrderStatus: async (orderId, status) => {
    const res = await api.patch(`/orders/${orderId}/status`, { status });
    set((s) => ({
      activeOrders: s.activeOrders.map((o) =>
        o.orderId === orderId ? { ...o, status } : o
      ),
      orders: s.orders.map((o) =>
        o.orderId === orderId ? { ...o, status } : o
      ),
    }));
    return res.data;
  },
}));

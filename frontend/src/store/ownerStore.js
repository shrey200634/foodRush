import { create } from "zustand";
import api from "../api/axios";

export const useOwnerStore = create((set, get) => ({
  myRestaurant: null,
  activeOrders: [],
  menuItems: [],
  loading: false,
  error: null,

  fetchMyRestaurant: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get("/restaurants/my");
      const restaurants = Array.isArray(res.data) ? res.data : [res.data];
      const myRestaurant = restaurants.length > 0 ? restaurants[0] : null;
      set({ myRestaurant, loading: false });
      return myRestaurant;
    } catch (err) {
      set({ error: "Failed to fetch restaurant", loading: false });
      return null;
    }
  },

  fetchActiveOrders: async () => {
    const { myRestaurant } = get();
    if (!myRestaurant) return;
    set({ loading: true });
    try {
      const res = await api.get(`/orders/restaurant/${myRestaurant.restaurantId}/active`);
      set({ activeOrders: Array.isArray(res.data) ? res.data : [], loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  acceptOrder: async (orderId, prepTime = 15) => {
    const { myRestaurant, activeOrders } = get();
    if (!myRestaurant) return;
    try {
      await api.post(`/restaurants/${myRestaurant.restaurantId}/accept-order/${orderId}?prepTime=${prepTime}`);
      // Optimistically update
      set({
        activeOrders: activeOrders.map(o => 
          o.orderId === orderId ? { ...o, status: "CONFIRMED" } : o
        )
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  updateOrderStatus: async (orderId, status) => {
      const { activeOrders } = get();
      try {
        await api.patch(`/orders/${orderId}/status`, { status });
        set({
            activeOrders: activeOrders.map(o => 
              o.orderId === orderId ? { ...o, status } : o
            )
        });
      } catch(err) {
          throw err;
      }
  },

  fetchMenu: async () => {
    const { myRestaurant } = get();
    if (!myRestaurant) return;
    set({ loading: true });
    try {
      const res = await api.get(`/restaurants/${myRestaurant.restaurantId}/menu/all`);
      set({ menuItems: Array.isArray(res.data) ? res.data : [], loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  toggleMenuItem: async (itemId) => {
    const { myRestaurant, menuItems } = get();
    if (!myRestaurant) return;
    try {
      await api.patch(`/restaurants/${myRestaurant.restaurantId}/menu/items/${itemId}/toggle`);
      set({
        menuItems: menuItems.map(m => 
          m.menuItemId === itemId ? { ...m, inStock: !m.inStock } : m
        )
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}));

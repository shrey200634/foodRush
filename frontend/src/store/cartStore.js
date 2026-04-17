import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/axios";

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],           // [{ menuItemId, name, price, isVeg, imageUrl, quantity, restaurantId, restaurantName }]
      restaurantId: null,
      restaurantName: null,
      loading: false,

      // ── computed (use functions, not getters — getters break with persist) ──
      getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      // ── actions ──

      // Returns true if cart was cleared (cross-restaurant), false if normal add
      addItem: async (item, restaurantId, restaurantName) => {
        const state = get();
        // Cross-restaurant guard
        if (state.restaurantId && state.restaurantId !== restaurantId && state.items.length > 0) {
          return { conflict: true, existingRestaurant: state.restaurantName };
        }

        // Sync to backend
        try {
          await api.post("/cart/add", {
            restaurantId,
            restaurantName: restaurantName,
            menuItemId: item.itemId,
            menuItemName: item.name,
            unitPrice: item.price,
            quantity: 1,
          });
        } catch (e) {
          // silent — still update local state
        }

        set((s) => {
          const existing = s.items.find((i) => i.menuItemId === item.itemId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.menuItemId === item.itemId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return {
            restaurantId,
            restaurantName,
            items: [
              ...s.items,
              {
                menuItemId: item.itemId,
                name: item.name,
                price: item.price,
                isVeg: item.isVeg,
                imageUrl: item.imageUrl,
                quantity: 1,
                restaurantId,
                restaurantName,
              },
            ],
          };
        });
        return { conflict: false };
      },

      clearAndAdd: async (item, restaurantId, restaurantName) => {
        try { await api.delete("/cart/clear"); } catch {}
        set({
          items: [
            {
              menuItemId: item.itemId,
              name: item.name,
              price: item.price,
              isVeg: item.isVeg,
              imageUrl: item.imageUrl,
              quantity: 1,
              restaurantId,
              restaurantName,
            },
          ],
          restaurantId,
          restaurantName,
        });
      },

      updateQuantity: async (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        try {
          await api.put(`/cart/update/${menuItemId}`, { quantity });
        } catch {}
        set((s) => ({
          items: s.items.map((i) =>
            i.menuItemId === menuItemId ? { ...i, quantity } : i
          ),
        }));
      },

      removeItem: async (menuItemId) => {
        try {
          await api.delete(`/cart/remove/${menuItemId}`);
        } catch {}
        set((s) => {
          const items = s.items.filter((i) => i.menuItemId !== menuItemId);
          return {
            items,
            restaurantId: items.length === 0 ? null : s.restaurantId,
            restaurantName: items.length === 0 ? null : s.restaurantName,
          };
        });
      },

      clearCart: async () => {
        try { await api.delete("/cart/clear"); } catch {}
        set({ items: [], restaurantId: null, restaurantName: null });
      },

      // Sync from backend (call on app load)
      fetchCart: async () => {
        set({ loading: true });
        try {
          const res = await api.get("/cart");
          const data = res.data;
          if (data && data.items && Array.isArray(data.items)) {
            set({
              items: data.items,
              restaurantId: data.restaurantId || null,
              restaurantName: data.restaurantName || null,
              loading: false,
            });
          } else {
            set({ loading: false });
          }
        } catch {
          set({ loading: false });
        }
      },
    }),
    {
      name: "foodrush-cart",
      partialize: (s) => ({
        items: s.items,
        restaurantId: s.restaurantId,
        restaurantName: s.restaurantName,
      }),
    }
  )
);

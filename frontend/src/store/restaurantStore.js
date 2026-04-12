import { create } from "zustand";
import api from "../api/axios";

export const useRestaurantStore = create((set, get) => ({
  topRated: [],
  nearby: [],
  searchResults: [],
  current: null,
  categories: [],
  menuItems: [],
  reviews: [],
  loading: false,
  menuLoading: false,

  fetchTopRated: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/restaurants/top-rated");
      set({ topRated: res.data, loading: false });
    } catch { set({ loading: false }); }
  },

  fetchNearby: async (lat = 28.6139, lng = 77.2090) => {
    try {
      const res = await api.get("/restaurants/nearby", { params: { latitude: lat, longitude: lng } });
      set({ nearby: res.data });
    } catch {}
  },

  searchRestaurants: async (query) => {
    set({ loading: true });
    try {
      const res = await api.get("/restaurants/search", { params: { query } });
      set({ searchResults: res.data, loading: false });
    } catch { set({ loading: false }); }
  },

  fetchRestaurant: async (id) => {
    set({ loading: true, current: null });
    try {
      const [details, categories, items, reviews] = await Promise.all([
        api.get(`/restaurants/${id}`),
        api.get(`/restaurants/${id}/menu/categories`),
        api.get(`/restaurants/${id}/menu/all`),
        api.get(`/restaurants/${id}/reviews`).catch(() => ({ data: [] })),
      ]);
      set({
        current: details.data,
        categories: categories.data || [],
        menuItems: items.data || [],
        reviews: reviews.data || [],
        loading: false,
      });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  submitReview: async (restaurantId, rating, comment) => {
    const res = await api.post(`/restaurants/${restaurantId}/reviews`, { rating, comment });
    set((s) => ({ reviews: [res.data, ...s.reviews] }));
    return res.data;
  },
}));

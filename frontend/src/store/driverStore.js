import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/axios";

export const useDriverStore = create(
  persist(
    (set, get) => ({
      driverProfile: null,
      activeDelivery: null,
      deliveryHistory: [],
      isOnline: false,
      currentLocation: null,
      locationWatchId: null,
      loading: false,

      // ── Profile ─────────────────────────────────────────────────────
      fetchProfile: async () => {
        set({ loading: true });
        try {
          const res = await api.get("/driver/profile");
          set({ driverProfile: res.data, loading: false });
          return res.data;
        } catch {
          set({ loading: false });
          return null;
        }
      },

      registerDriver: async (data) => {
        const res = await api.post("/driver/register", data);
        set({ driverProfile: res.data.driver });
        return res.data;
      },

      // ── Online/Offline ──────────────────────────────────────────────
      goOnline: async (latitude, longitude) => {
        const res = await api.post("/driver/go-online", null, {
          params: { latitude, longitude },
        });
        set({ isOnline: true, driverProfile: res.data.driver });
        return res.data;
      },

      goOffline: async () => {
        const res = await api.post("/driver/go-offline");
        set({ isOnline: false, driverProfile: res.data.driver });
        // Stop location tracking
        const watchId = get().locationWatchId;
        if (watchId) {
          navigator.geolocation.clearWatch(watchId);
          set({ locationWatchId: null });
        }
        return res.data;
      },

      // ── Location ─────────────────────────────────────────────────────
      updateLocation: async (latitude, longitude) => {
        const driverId = get().driverProfile?.driverId;
        if (!driverId) return;
        set({ currentLocation: { latitude, longitude } });
        try {
          await api.post("/driver/location", {
            driverId,
            latitude,
            longitude,
          });
        } catch {}
      },

      startLocationTracking: () => {
        if (!navigator.geolocation) return;
        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            get().updateLocation(latitude, longitude);
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
        );
        set({ locationWatchId: watchId });
      },

      stopLocationTracking: () => {
        const watchId = get().locationWatchId;
        if (watchId) {
          navigator.geolocation.clearWatch(watchId);
          set({ locationWatchId: null });
        }
      },

      // ── Deliveries ───────────────────────────────────────────────────
      fetchActiveDelivery: async () => {
        try {
          const res = await api.get("/delivery/driver/active");
          set({ activeDelivery: res.data });
          return res.data;
        } catch {
          set({ activeDelivery: null });
          return null;
        }
      },

      fetchDeliveryHistory: async () => {
        try {
          const res = await api.get("/delivery/driver/history");
          const deliveries = res.data?.deliveries || res.data || [];
          set({ deliveryHistory: Array.isArray(deliveries) ? deliveries : [] });
        } catch {}
      },

      confirmPickup: async () => {
        const res = await api.post("/delivery/pickup");
        set({ activeDelivery: res.data.delivery });
        return res.data;
      },

      completeDelivery: async () => {
        const res = await api.post("/delivery/complete");
        set({ activeDelivery: null });
        return res.data;
      },
    }),
    {
      name: "foodrush-driver",
      partialize: (state) => ({
        driverProfile: state.driverProfile,
        isOnline: state.isOnline,
      }),
    }
  )
);

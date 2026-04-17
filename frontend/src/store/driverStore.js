import { create } from "zustand";
import api from "../api/axios";

export const useDriverStore = create((set, get) => ({
  driverProfile: null,
  activeDelivery: null,
  history: [],
  loading: false,

  fetchProfile: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/driver/profile");
      set({ driverProfile: res.data, loading: false });
    } catch {
      // If profile not found, maybe they are a new driver. Register them automatically!
      try {
        const regRes = await api.post("/driver/register", {
          vehicleType: "BIKE",
          licenseNumber: "DRV-" + Math.floor(Math.random() * 1000000)
        });
        set({ driverProfile: regRes.data?.driver || regRes.data, loading: false });
      } catch {
        set({ loading: false });
      }
    }
  },

  goOnline: async (lat, lng) => {
    try {
      const res = await api.post(`/driver/go-online?latitude=${lat}&longitude=${lng}`);
      set({ driverProfile: res.data?.driver || res.data });
    } catch (e) {
      console.error(e);
    }
  },

  goOffline: async () => {
    try {
      const res = await api.post("/driver/go-offline");
      set({ driverProfile: res.data?.driver || res.data });
    } catch (e) {
      console.error(e);
    }
  },

  fetchActiveDelivery: async () => {
    try {
      const res = await api.get("/delivery/driver/active");
      set({ activeDelivery: res.data });
    } catch {
      set({ activeDelivery: null }); // 404 or missing
    }
  },

  confirmPickup: async () => {
    try {
      const res = await api.post("/delivery/pickup");
      set({ activeDelivery: res.data?.delivery || res.data });
      return true;
    } catch (e) {
      throw e;
    }
  },

  completeDelivery: async () => {
    try {
      const res = await api.post("/delivery/complete");
      set({ activeDelivery: null });
      return true;
    } catch (e) {
      throw e;
    }
  },

  updateLocation: async (lat, lng) => {
    const profile = get().driverProfile;
    if (!profile) return;
    try {
      await api.post("/driver/location", {
        driverId: profile.driverId,
        latitude: lat,
        longitude: lng
      });
    } catch (e) {
      // Silent fail
    }
  }
}));

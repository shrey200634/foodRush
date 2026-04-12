import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: "/api/v1",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only force logout when the auth endpoints themselves reject the token
    const url = err.config?.url || "";
    const isAuthCritical =
      url.endsWith("/auth/login") ||
      url.endsWith("/users/profile") && err.config?.method === "get";

    if (err.response?.status === 401 && isAuthCritical) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
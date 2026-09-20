import axios from "axios";
import { useAuthStore } from "@/lib/auth/store";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
  headers: { Accept: "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Un jeton expire ou revoque met fin a la session locale : les pages
    // protegees (voir components/auth/RequireAuth) redirigent alors vers la
    // connexion des le prochain rendu, sans que chaque appel API n'ait a s'en
    // soucier individuellement.
    if (error.response?.status === 401) {
      useAuthStore.getState().clear();
    }

    return Promise.reject(error);
  },
);

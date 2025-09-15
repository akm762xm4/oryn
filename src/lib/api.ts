import axios from "axios";

const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Flag to prevent multiple redirects
let isRedirecting = false;

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response && error.code === "NETWORK_ERROR") {
      // Don't redirect on network errors, just reject the promise
      return Promise.reject({
        ...error,
        code: "NETWORK_ERROR",
        message: "Network Error",
      });
    }

    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;

      // Clear auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      // Dispatch a custom event to notify components
      window.dispatchEvent(
        new CustomEvent("auth:logout", {
          detail: { reason: "token_expired" },
        })
      );

      // Redirect after a small delay to allow cleanup
      setTimeout(() => {
        window.location.href = "/login";
      }, 100);
    }
    return Promise.reject(error);
  }
);

export default api;
